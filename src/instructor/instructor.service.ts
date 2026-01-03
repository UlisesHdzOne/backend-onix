import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InstructorResponse } from './types/instructor.response';
import { CreateInstructorDto } from './dto/create-instructor.dto';
import { UpdateInstructorDto } from './dto/update-instructor.dto';
import { InstructorStatus } from '@prisma/client';
import {
  INSTRUCTOR_STATUS_TRANSITIONS_INSTRUCTOR,
  isValidTransitionInstructor,
} from './domain/instructor-status.transitions';

@Injectable()
export class InstructorService {
  constructor(private readonly prisma: PrismaService) {}

  async createInstructor(dto: CreateInstructorDto): Promise<InstructorResponse> {
    await this.ensureInstructorNameNotExists(dto.name);
    await this.ensureInstructorEmailNotExists(dto.email);

    return this.prisma.instructor.create({
      data: dto,
      select: { id: true, name: true, email: true, status: true, createdAt: true, updatedAt: true },
    });
  }

  async findOneInstructorById(id: number): Promise<InstructorResponse> {
    const instructor = await this.prisma.instructor.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, status: true, createdAt: true, updatedAt: true },
    });

    if (!instructor) {
      throw new NotFoundException(`Instructor with id ${id} not found`);
    }

    return instructor;
  }

  async findAllInstructors(): Promise<InstructorResponse[]> {
    return this.prisma.instructor.findMany({
      select: { id: true, email: true, name: true, status: true, createdAt: true, updatedAt: true },
    });
  }

  async updateInstructor(id: number, dto: UpdateInstructorDto): Promise<InstructorResponse> {
    await this.ensureInstructorExists(id);

    if (dto.name) {
      await this.ensureInstructorNameNotExists(dto.name, id);
    }

    if (dto.email) {
      await this.ensureInstructorEmailNotExists(dto.email, id);
    }

    return this.prisma.instructor.update({
      where: { id },
      data: dto,
      select: { id: true, name: true, email: true, status: true, createdAt: true, updatedAt: true },
    });
  }

  async deleteInstructor(id: number): Promise<InstructorResponse> {
    await this.ensureInstructorExists(id);

    // Verifica que no tenga cursos asignados
    const hasCourses = await this.prisma.course.findFirst({
      where: { instructorId: id },
      select: { id: true },
    });

    if (hasCourses) {
      throw new ConflictException(
        `Cannot delete instructor ${id} because they have courses assigned. Unassign courses first.`,
      );
    }

    return this.prisma.instructor.delete({
      where: { id },
      select: { id: true, name: true, email: true, status: true, createdAt: true, updatedAt: true },
    });
  }

  async updateInstructorStatus(id: number, status: InstructorStatus): Promise<InstructorResponse> {
    // 1. Obtener el instructor ACTUAL (con su estado)
    const instructor = await this.prisma.instructor.findUnique({
      where: { id },
      select: { id: true, status: true, name: true },
    });

    if (!instructor) {
      throw new NotFoundException(`Instructor with id ${id} not found`);
    }
    // 2. Validar la transición
    this.validateInstructorStatusTransition(instructor.status, status);

    // 3. Validaciones adicionales (cursos para INACTIVE)
    if (status === InstructorStatus.INACTIVE) {
      await this.validateNoActiveCourses(id);
    }

    return this.prisma.instructor.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  //Validaciones
  async ensureInstructorNameNotExists(name: string, ignoreId?: number): Promise<void> {
    const instructor = await this.prisma.instructor.findFirst({
      where: {
        name,
        NOT: ignoreId ? { id: ignoreId } : undefined,
      },
      select: { id: true },
    });

    if (instructor) {
      throw new ConflictException(`Instructor with ${name} already exists`);
    }
  }

  async ensureInstructorEmailNotExists(email: string, ignoreId?: number): Promise<void> {
    const instructor = await this.prisma.instructor.findFirst({
      where: {
        email,
        NOT: ignoreId ? { id: ignoreId } : undefined,
      },
      select: { id: true },
    });
    if (instructor) throw new ConflictException(`Instructor with ${email}  already exists`);
  }

  async ensureInstructorExists(id: number): Promise<void> {
    const exists = await this.prisma.instructor.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException(`Instructor with id ${id} not found`);
  }

  private validateInstructorStatusTransition(current: InstructorStatus, next: InstructorStatus) {
    if (current === next) {
      throw new ConflictException('Status is already set to ' + current);
    }

    if (!isValidTransitionInstructor(current, next)) {
      throw new ConflictException(
        `Invalid status transition from ${current} to ${next}. ` +
          `Allowed: ${INSTRUCTOR_STATUS_TRANSITIONS_INSTRUCTOR[current].join(', ') || 'none'}`,
      );
    }
  }

  // Nueva validación para cursos activos
  private async validateNoActiveCourses(instructorId: number): Promise<void> {
    const activeCourses = await this.prisma.course.findFirst({
      where: {
        instructorId,
        isActive: true,
      },
      select: { id: true, name: true },
    });

    if (activeCourses) {
      throw new ConflictException(
        `Cannot set instructor to INACTIVE while they have active courses. ` +
          `Course "${activeCourses.name}" (ID: ${activeCourses.id}) is still active.`,
      );
    }
  }
}
