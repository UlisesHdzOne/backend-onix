import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { DrivenService } from '../../modules/driven/driven.service';
import { CourseStatus } from './dto/update-course-status.dto';

@Injectable()
export class CourseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly drivenService: DrivenService,
  ) {}

  // ================================
  // CRUD PRINCIPAL
  // ================================

  async createCourse(dto: CreateCourseDto) {
    await this.validateCourseNameNotExists(dto.name); // Validación de unicidad
    return this.prisma.course.create({ data: dto }); // Crear course
  }

  async findAllCourses() {
    return this.prisma.course.findMany(); // Obtener todos los courses
  }

  async updateCourse(id: number, dto: UpdateCourseDto) {
    await this.findCourseById(id); // Validar existencia

    if (dto.name) {
      const existingCourse = await this.prisma.course.findUnique({ where: { name: dto.name } });
      if (existingCourse && existingCourse.id !== id) {
        throw new ConflictException(`Course with name ${dto.name} already exists`);
      }
    }

    return this.prisma.course.update({ where: { id }, data: dto }); // Actualizar course
  }

  async removeCourse(id: number) {
    await this.findCourseById(id); // Validar existencia

    const assignments = await this.prisma.drivenCourse.findMany({ where: { courseId: id } });
    if (assignments.length > 0) {
      throw new ConflictException(`Course ${id} has assigned drivens and cannot be deleted`);
    }

    return this.prisma.course.delete({ where: { id } }); // Eliminar course
  }

  // ================================
  // MÉTODOS DE VALIDACIÓN / EXISTENCIA
  // ================================

  async findCourseById(id: number) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException(`Course with id ${id} not found`);
    return course;
  }

  async validateCourseNameNotExists(name: string): Promise<void> {
    const course = await this.prisma.course.findUnique({ where: { name } });
    if (course) {
      throw new ConflictException(`Course with name ${name} already exists`);
    }
  }

  // ================================
  // REGLAS DE DOMINIO / RELACIONES
  // ================================

  async assignCourseToDriven(drivenId: number, courseId: number) {
    await this.findCourseById(courseId);
    await this.drivenService.findDrivenById(drivenId);

    const existing = await this.prisma.drivenCourse.findUnique({
      where: { drivenId_courseId: { drivenId, courseId } },
    });
    if (existing)
      throw new ConflictException(`Driven ${drivenId} is already assigned to course ${courseId}`);

    return this.prisma.drivenCourse.create({
      data: { drivenId, courseId, status: CourseStatus.IN_PROGRESS },
    });
  }

  async removeDrivenFromCourse(drivenId: number, courseId: number) {
    const assignment = await this.prisma.drivenCourse.findUnique({
      where: { drivenId_courseId: { drivenId, courseId } },
    });
    if (!assignment)
      throw new NotFoundException(`Driven ${drivenId} is not assigned to course ${courseId}`);

    return this.prisma.drivenCourse.delete({ where: { id: assignment.id } });
  }

  async updateCourseStatus(drivenId: number, courseId: number, status: CourseStatus) {
    const assignment = await this.prisma.drivenCourse.findUnique({
      where: { drivenId_courseId: { drivenId, courseId } },
    });
    if (!assignment)
      throw new NotFoundException(`Driven ${drivenId} is not assigned to course ${courseId}`);

    return this.prisma.drivenCourse.update({ where: { id: assignment.id }, data: { status } });
  }
}
