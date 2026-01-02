import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { DrivenService } from '../../modules/driven/driven.service';
import {
  AssignCourseWithRelationsResponse,
  CourseResponse,
  UpdateCourseStatusResponse,
} from './types/course.response';
import { CourseStatus } from '@prisma/client';
import { COURSE_STATUS_TRANSITIONS } from './domain/course-status.transitions';

@Injectable()
export class CourseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly drivenService: DrivenService,
  ) {}

  // ================================
  // CRUD PRINCIPAL
  // ================================

  async createCourse(dto: CreateCourseDto): Promise<CourseResponse> {
    await this.validateCourseNameNotExists(dto.name); // Validación de unicidad
    const course = await this.prisma.course.create({ data: dto }); // Crear course

    return {
      id: course.id,
      name: course.name,
      isActive: course.isActive,
    };
  }

  async findAllCourses(): Promise<CourseResponse[]> {
    const courses = await this.prisma.course.findMany(); // Obtener todos los courses

    return courses.map((course) => ({
      id: course.id,
      name: course.name,
      isActive: course.isActive,
    }));
  }

  async updateCourse(id: number, dto: UpdateCourseDto): Promise<CourseResponse> {
    await this.ensureCourseExists(id); // Validar existencia

    if (dto.name) {
      await this.validateCourseNameNotExists(dto.name);
    }

    const updated = await this.prisma.course.update({ where: { id }, data: dto }); // Actualizar course

    return {
      id: updated.id,
      name: updated.name,
      isActive: updated.isActive,
    };
  }

  async removeCourse(id: number): Promise<CourseResponse> {
    await this.ensureCourseExists(id); // Validar existencia

    const hasDrivens = await this.prisma.drivenCourse.findFirst({
      where: { courseId: id },
      select: { id: true },
    });

    if (hasDrivens) {
      throw new ConflictException(`Course ${id} has drivens assigned and cannot be deleted`);
    }

    const deleted = await this.prisma.course.delete({ where: { id } }); // Eliminar course

    return {
      id: deleted.id,
      name: deleted.name,
      isActive: deleted.isActive,
    };
  }

  // ================================
  // MÉTODOS DE VALIDACIÓN / EXISTENCIA
  // ================================

  // verificar existencia de course
  async ensureCourseExists(id: number): Promise<void> {
    const exists = await this.prisma.course.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException(`Course with id ${id} not found`);
  }

  async validateCourseNameNotExists(name: string): Promise<void> {
    const course = await this.prisma.course.findUnique({
      where: { name },
      select: { id: true },
    });
    if (course) {
      throw new ConflictException(`Course with name ${name} already exists`);
    }
  }

  private validateCourseStatusTransition(current: CourseStatus, next: CourseStatus) {
    const allowed = COURSE_STATUS_TRANSITIONS[current] ?? [];

    if (current === next) {
      throw new ConflictException('Status is already set');
    }

    if (!allowed.includes(next)) {
      throw new ConflictException(`Invalid status transition from ${current} to ${next}`);
    }
  }

  // ================================
  // REGLAS DE DOMINIO / RELACIONES
  // ================================

  async assignCourseToDriven(
    drivenId: number,
    courseId: number,
  ): Promise<AssignCourseWithRelationsResponse> {
    await this.ensureCourseExists(courseId);
    await this.drivenService.ensureDrivenExists(drivenId);

    const existing = await this.prisma.drivenCourse.findUnique({
      where: { drivenId_courseId: { drivenId, courseId } },
    });
    if (existing)
      throw new ConflictException(`Driven ${drivenId} is already assigned to course ${courseId}`);

    const assignment = await this.prisma.drivenCourse.create({
      data: { drivenId, courseId, status: CourseStatus.IN_PROGRESS },
      include: {
        course: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      id: assignment.id,
      status: assignment.status,
      assignedAt: assignment.assignedAt,
      course: assignment.course,
    };
  }

  async removeDrivenFromCourse(drivenId: number, courseId: number) {
    const assignment = await this.prisma.drivenCourse.findUnique({
      where: { drivenId_courseId: { drivenId, courseId } },
    });
    if (!assignment)
      throw new NotFoundException(`Driven ${drivenId} is not assigned to course ${courseId}`);

    return this.prisma.drivenCourse.delete({ where: { id: assignment.id } });
  }

  async updateCourseStatus(
    drivenId: number,
    courseId: number,
    status: CourseStatus,
  ): Promise<UpdateCourseStatusResponse> {
    const assignment = await this.prisma.drivenCourse.findUnique({
      where: { drivenId_courseId: { drivenId, courseId } },
    });
    if (!assignment)
      throw new NotFoundException(`Driven ${drivenId} is not assigned to course ${courseId}`);

    this.validateCourseStatusTransition(assignment.status, status);

    const updated = await this.prisma.drivenCourse.update({
      where: { id: assignment.id },
      data: { status },
    });

    return {
      id: updated.id,
      drivenId: updated.drivenId,
      courseId: updated.courseId,
      status: updated.status,
      assignedAt: updated.assignedAt,
    };
  }
}
