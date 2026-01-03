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
import { CourseStatus, Prisma } from '@prisma/client';
import { isValidTransition, COURSE_STATUS_TRANSITIONS } from './domain/course-status.transitions';
import { PaginationHelper } from '../../common/helpers/pagination.helper';
import { PaginatedResponse } from '../../common/types/pagination.types';

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

  async findAllCourses(
    page: number = PaginationHelper.DEFAULT_PAGE,
    limit: number = PaginationHelper.DEFAULT_LIMIT,
    search?: string,
    isActive?: boolean,
  ): Promise<PaginatedResponse<CourseResponse>> {
    const { skip, take } = PaginationHelper.validate(page, limit);

    const where: Prisma.CourseWhereInput = {};

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip,
        take,
        select: { id: true, name: true, isActive: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.course.count({ where }),
    ]);

    return {
      data: courses.map((course) => ({
        id: course.id,
        name: course.name,
        isActive: course.isActive,
      })),
      meta: PaginationHelper.buildMeta(page, limit, total),
    };
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
    if (current === next) {
      throw new ConflictException('Status is already set to ' + current);
    }

    if (!isValidTransition(current, next)) {
      throw new ConflictException(
        `Invalid status transition from ${current} to ${next}. ` +
          `Allowed: ${COURSE_STATUS_TRANSITIONS[current].join(', ') || 'none'}`,
      );
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

    const updated = (await this.prisma.drivenCourse.update({
      where: { id: assignment.id },
      data: { status },
      select: {
        id: true,
        drivenId: true,
        courseId: true,
        status: true,
        progress: true,
        assignedAt: true,
      },
    })) as {
      id: number;
      drivenId: number;
      courseId: number;
      status: CourseStatus;
      progress: number;
      assignedAt: Date;
    };

    return {
      id: updated.id,
      drivenId: updated.drivenId,
      courseId: updated.courseId,
      status: updated.status,
      progress: updated.progress,
      assignedAt: updated.assignedAt,
    };
  }

  async updateCourseProgress(
    drivenId: number,
    courseId: number,
    progress: number, // 0 a 100
  ): Promise<UpdateCourseStatusResponse> {
    // Reutilizamos validaciones existentes
    await this.ensureCourseExists(courseId);
    await this.drivenService.ensureDrivenExists(drivenId);

    const assignment = await this.prisma.drivenCourse.findUnique({
      where: { drivenId_courseId: { drivenId, courseId } },
    });

    if (!assignment)
      throw new NotFoundException(`Driven ${drivenId} is not assigned to course ${courseId}`);

    if (
      assignment.status === CourseStatus.COMPLETED ||
      assignment.status === CourseStatus.CANCELED
    ) {
      throw new ConflictException(
        'Cannot update progress for a course that is completed or canceled',
      );
    }

    // Limitar progress a 0-100
    const normalizedProgress = Math.min(Math.max(progress, 0), 100);
    const newStatus = normalizedProgress >= 100 ? CourseStatus.COMPLETED : assignment.status;

    this.validateCourseStatusTransition(assignment.status, newStatus);

    const updated = (await this.prisma.drivenCourse.update({
      where: { id: assignment.id },
      data: {
        progress: normalizedProgress,
        status: newStatus,
      },
      select: {
        id: true,
        drivenId: true,
        courseId: true,
        status: true,
        progress: true,
        assignedAt: true,
      },
    })) as {
      id: number;
      drivenId: number;
      courseId: number;
      status: CourseStatus;
      progress: number;
      assignedAt: Date;
    };

    return {
      id: updated.id,
      drivenId: updated.drivenId,
      courseId: updated.courseId,
      status: updated.status,
      progress: updated.progress,
      assignedAt: updated.assignedAt,
    };
  }
}
