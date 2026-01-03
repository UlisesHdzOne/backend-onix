import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { DrivenService } from '../driven/driven.service';
import { VehicleResponse } from './types/vehicles.response';
import { PaginationHelper } from 'src/common/helpers/pagination.helper';
import { PaginatedResponse } from '../../common/types/pagination.types';
import { Prisma } from '@prisma/client';

@Injectable()
export class VehiclesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly drivenService: DrivenService,
  ) {}

  // ============================
  // CRUD
  // ============================

  // Crea un Vehicle.
  async createVehicle(dto: CreateVehicleDto): Promise<VehicleResponse> {
    await this.validateVehicleNameNotExists(dto.name);
    const created = await this.prisma.vehicle.create({ data: { name: dto.name } });
    return {
      id: created.id,
      name: created.name,
    };
  }

  // Obtiene todos los Vehicles.

  // Cambia esta función en vehicles.service.ts:
  async findAllVehicles(
    page: number = PaginationHelper.DEFAULT_PAGE,
    limit: number = PaginationHelper.DEFAULT_LIMIT,
    search?: string,
    drivenId?: number | null, // ← Cambia de number? a number | null | undefined
  ): Promise<PaginatedResponse<VehicleResponse>> {
    const { skip, take } = PaginationHelper.validate(page, limit);

    const where: Prisma.VehicleWhereInput = {};

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    // CAMBIO IMPORTANTE: drivenId puede ser null, undefined, o number
    if (drivenId !== undefined) {
      where.drivenId = drivenId;
    }

    const [vehicles, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          name: true,
          driven: {
            select: { id: true, name: true },
          },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.vehicle.count({ where }),
    ]);

    return {
      data: vehicles.map((vehicle) => ({
        id: vehicle.id,
        name: vehicle.name,
        driven: vehicle.driven
          ? {
              id: vehicle.driven.id,
              name: vehicle.driven.name,
            }
          : undefined,
      })),
      meta: PaginationHelper.buildMeta(page, limit, total),
    };
  }
  // Actualiza un Vehicle existente.
  async updateVehicle(vehicleId: number, dto: UpdateVehicleDto): Promise<VehicleResponse> {
    await this.findVehicleById(vehicleId);

    if (dto.name) {
      await this.validateVehicleNameNotUsedByAnother(vehicleId, dto.name);
    }

    const updated = await this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: { name: dto.name },
    });

    return {
      id: updated.id,
      name: updated.name,
    };
  }

  // Elimina un Vehicle.
  async removeVehicle(id: number): Promise<VehicleResponse> {
    const vehicle = await this.findVehicleById(id);

    if (vehicle.drivenId) {
      throw new ConflictException(`Vehicle with id ${id} has a driven assigned. Unassign first.`);
    }

    const deleted = await this.prisma.vehicle.delete({ where: { id } });

    return {
      id: deleted.id,
      name: deleted.name,
    };
  }

  // Falta este endpoint para completar el ciclo
  async unassignDrivenFromVehicle(vehicleId: number): Promise<VehicleResponse> {
    const vehicle = await this.findVehicleById(vehicleId);

    if (!vehicle.drivenId) {
      throw new ConflictException(`Vehicle ${vehicleId} doesn't have a driven assigned.`);
    }

    const updated = await this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: { drivenId: null },
    });

    return {
      id: updated.id,
      name: updated.name,
      // driven queda undefined (correcto)
    };
  }

  // ============================
  // Validaciones / Existencia
  // ============================

  // Valida que un Vehicle exista por su id y lo retorna.
  async findVehicleById(id: number) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) throw new NotFoundException(`Vehicle with id ${id} not found`);
    return vehicle;
  }

  // Valida que no exista un Vehicle con el mismo nombre.
  async validateVehicleNameNotExists(name: string) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { name } });
    if (vehicle) throw new ConflictException(`Vehicle with name ${name} already exists`);
  }

  // Valida que el nombre no esté siendo usado por otro Vehicle.
  async validateVehicleNameNotUsedByAnother(vehicleId: number, name: string) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { name } });
    if (vehicle && vehicle.id !== vehicleId) {
      throw new ConflictException(`Vehicle with name ${name} already exists`);
    }
  }

  // ============================
  // Reglas de dominio / Relaciones
  // ============================

  // Asigna un Driven a un Vehicle.
  // Regla de dominio: relación N–1 (muchos Vehicles pueden pertenecer a un Driven).
  async assignDrivenToVehicle(vehicleId: number, drivenId: number): Promise<VehicleResponse> {
    // Validación de existencia:
    // Verifica que el Vehicle exista antes de asignar la relación.
    const vehicle = await this.findVehicleById(vehicleId);

    if (vehicle.drivenId) {
      throw new ConflictException(
        `Vehicle ${vehicleId} already has a driven assigned. Unassign first.`,
      );
    }

    // Validación de existencia:Verifica que el Driven exista antes de asociarlo al Vehicle.
    await this.drivenService.ensureDrivenExists(drivenId);

    // Aplicación de la relación N–1: Se asigna el drivenId al Vehicle.
    const updated = await this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: { drivenId },
      include: { driven: true },
    });

    // Mapeo del resultado a DTO.
    return {
      id: updated.id,
      name: updated.name,
      driven: updated.driven
        ? {
            id: updated.driven.id,
            name: updated.driven.name,
          }
        : undefined,
    };
  }

  // Obtiene todos los Vehicles con su Driven asociado.
  async findAllVehiclesWithDriven(): Promise<VehicleResponse[]> {
    const vehicles = await this.prisma.vehicle.findMany({ include: { driven: true } });
    return vehicles.map((vehicle) => ({
      id: vehicle.id,
      name: vehicle.name,
      driven: vehicle.driven
        ? {
            id: vehicle.driven.id,
            name: vehicle.driven.name,
          }
        : undefined,
    }));
  }
}
