import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateDrivenDto } from './dto/create-driven.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateDrivenDto } from './dto/update-driven.dto';
import { DrivenResponse } from './types/driven.response';
import { PaginationHelper } from '../../common/helpers/pagination.helper';
import { PaginatedResponse } from '../../common/types/pagination.types';
import { Prisma } from '@prisma/client';

@Injectable()
export class DrivenService {
  constructor(private readonly prisma: PrismaService) {}

  // ================================
  // CRUD PRINCIPAL
  // ================================

  // Crea un Driven.
  async createDriven(dto: CreateDrivenDto): Promise<DrivenResponse> {
    await this.validateDrivenNameNotExists(dto.name);
    const driven = await this.prisma.driven.create({ data: { name: dto.name } });
    return {
      id: driven.id,
      name: driven.name,
    };
  }

  // Obtiene todos los Drivens.
  async findAllDriven(
    page: number = PaginationHelper.DEFAULT_PAGE,
    limit: number = PaginationHelper.DEFAULT_LIMIT,
    search?: string,
  ): Promise<PaginatedResponse<DrivenResponse>> {
    const { skip, take } = PaginationHelper.validate(page, limit);

    const where: Prisma.DrivenWhereInput = {};

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [drivens, total] = await Promise.all([
      this.prisma.driven.findMany({
        where,
        skip,
        take,
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.driven.count({ where }),
    ]);

    return {
      data: drivens.map((driven) => ({ id: driven.id, name: driven.name })),
      meta: PaginationHelper.buildMeta(page, limit, total),
    };
  }

  // Obtiene todos los Drivens con sus vehículos.
  async findAllDrivenWithVehicle(): Promise<DrivenResponse[]> {
    const drivens = await this.prisma.driven.findMany({ include: { vehicles: true } });

    return drivens.map((driven) => ({
      id: driven.id,
      name: driven.name,
      vehicles: driven.vehicles.map((vehicle) => ({
        id: vehicle.id,
        name: vehicle.name,
      })),
    }));
  }

  // Actualiza un Driven existente.
  async updateDriven(id: number, dto: UpdateDrivenDto): Promise<DrivenResponse> {
    const current = await this.findDrivenById(id);

    // Si el nombre es diferente al actual
    if (dto.name && dto.name !== current.name) {
      await this.validateDrivenNameNotExists(dto.name);
    }

    const updated = await this.prisma.driven.update({
      where: { id },
      data: dto,
    });

    return {
      id: updated.id,
      name: updated.name,
    };
  }

  // Elimina un Driven.
  async removeDriven(id: number): Promise<DrivenResponse> {
    const driven = await this.findDrivenById(id);

    if (driven.vehicles.length > 0) {
      throw new ConflictException(`Driven with id ${id} has vehicles`);
    }

    if (driven.profile) {
      throw new ConflictException(`Driven with id ${id} has a profile`);
    }

    const deleted = await this.prisma.driven.delete({ where: { id } });

    return {
      id: deleted.id,
      name: deleted.name,
    };
  }

  // ================================
  // MÉTODOS DE VALIDACIÓN / EXISTENCIA
  // ================================

  // Valida que no exista otro Driven con el mismo nombre.
  async validateDrivenNameNotExists(name: string) {
    const driven = await this.prisma.driven.findUnique({ where: { name } });
    if (driven) {
      throw new ConflictException(`Driven with name ${name} already exists`);
    }
  }

  // Valida que un Driven exista por su id y lo retorna.
  private async findDrivenById(id: number) {
    const driven = await this.prisma.driven.findUnique({
      where: { id },
      include: {
        vehicles: true,
        profile: true,
      },
    });
    if (!driven) {
      throw new NotFoundException(`Driven with id ${id} not found`);
    }
    return driven;
  }

  // Valida que un Driven exista por su id.
  async ensureDrivenExists(id: number): Promise<void> {
    const exists = await this.prisma.driven.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists) {
      throw new NotFoundException(`Driven with id ${id} not found`);
    }
  }
}
