import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { DrivenService } from '../driven/driven.service';
import { VehicleDto } from './types/vehicles.types';

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
  async createVehicle(dto: CreateVehicleDto) {
    await this.validateVehicleNameNotExists(dto.name);
    return this.prisma.vehicle.create({ data: { name: dto.name } });
  }

  // Obtiene todos los Vehicles.
  async findAllVehicles(): Promise<VehicleDto[]> {
    const vehicles = await this.prisma.vehicle.findMany();
    return vehicles.map((vehicle) => ({
      id: vehicle.id,
      name: vehicle.name,
    }));
  }

  // Actualiza un Vehicle existente.
  async updateVehicle(vehicleId: number, dto: UpdateVehicleDto) {
    await this.findVehicleById(vehicleId);

    if (dto.name) {
      await this.validateVehicleNameNotUsedByAnother(vehicleId, dto.name);
    }

    return this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: { name: dto.name },
    });
  }

  // Elimina un Vehicle.
  async removeVehicle(id: number) {
    await this.findVehicleById(id);
    return this.prisma.vehicle.delete({ where: { id } });
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
  async assignDrivenToVehicle(vehicleId: number, drivenId: number): Promise<VehicleDto> {
    // Validación de existencia:
    // Verifica que el Vehicle exista antes de asignar la relación.
    await this.findVehicleById(vehicleId);

    // Validación de existencia:Verifica que el Driven exista antes de asociarlo al Vehicle.
    await this.drivenService.findDrivenById(drivenId);

    // Aplicación de la relación N–1: Se asigna el drivenId al Vehicle.
    const vehicle = await this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: { drivenId },
      include: { driven: true },
    });

    // Mapeo del resultado a DTO.
    return {
      id: vehicle.id,
      name: vehicle.name,
      driven: vehicle.driven
        ? {
            id: vehicle.driven.id,
            name: vehicle.driven.name,
          }
        : undefined,
    };
  }

  // Obtiene todos los Vehicles con su Driven asociado.
  async findAllVehiclesWithDriven(): Promise<VehicleDto[]> {
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
