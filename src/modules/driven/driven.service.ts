import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateDrivenDto } from './dto/create-driven.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateDrivenDto } from './dto/update-driven.dto';
import { DrivenDto } from './types/driven.types';

@Injectable()
export class DrivenService {
  constructor(private readonly prisma: PrismaService) {}

  // ================================
  // CRUD PRINCIPAL
  // ================================

  // Crea un Driven.
  async createDriven(dto: CreateDrivenDto) {
    await this.findDrivenByName(dto.name);
    return this.prisma.driven.create({ data: { name: dto.name } });
  }

  // Obtiene todos los Drivens.
  async findAllDriven(): Promise<DrivenDto[]> {
    const drivens = await this.prisma.driven.findMany();
    return drivens.map((driven) => ({
      id: driven.id,
      name: driven.name,
    }));
  }

  // Obtiene todos los Drivens con sus vehículos.
  async findAllDrivenWithVehicle() {
    return this.prisma.driven.findMany({ include: { vehicles: true } });
  }

  // Actualiza un Driven existente.
  async updateDriven(id: number, dto: UpdateDrivenDto) {
    await this.findDrivenById(id);

    if (dto.name) {
      const existingDriven = await this.prisma.driven.findUnique({
        where: { name: dto.name },
      });

      if (existingDriven && existingDriven.id !== id) {
        throw new ConflictException(`Driven with name ${dto.name} already exists`);
      }
    }

    return this.prisma.driven.update({
      where: { id },
      data: { name: dto.name },
    });
  }

  // Elimina un Driven.
  async removeDriven(id: number) {
    // Validación: el Driven debe existir.
    await this.findDrivenById(id);

    // Regla 1–N:
    // No se puede eliminar un Driven si tiene Vehicles asociados.
    const drivenWithVehicles = await this.findDrivenWithVehicleById(id);
    if (drivenWithVehicles.vehicles.length > 0) {
      throw new ConflictException(`Driven with id ${id} has vehicles`);
    }

    // Regla 1–1:
    // No se puede eliminar un Driven si tiene un Profile asociado.
    const profile = await this.prisma.profile.findUnique({
      where: { drivenId: id },
    });

    if (profile) {
      throw new ConflictException(`Driven with id ${id} has a profile`);
    }

    // Eliminación final segura.
    return this.prisma.driven.delete({ where: { id } });
  }

  // ================================
  // MÉTODOS DE VALIDACIÓN / EXISTENCIA
  // ================================

  // Valida que no exista otro Driven con el mismo nombre.
  async findDrivenByName(name: string) {
    const driven = await this.prisma.driven.findUnique({ where: { name } });
    if (driven) {
      throw new ConflictException(`Driven with name ${name} already exists`);
    }
    return driven;
  }

  // Valida que un Driven exista por su id y lo retorna.
  async findDrivenById(id: number) {
    const driven = await this.prisma.driven.findUnique({ where: { id } });
    if (!driven) {
      throw new NotFoundException(`Driven with id ${id} not found`);
    }
    return driven;
  }

  // ================================
  // MÉTODOS DE CONSULTA CON REGLAS DE DOMINIO
  // ================================

  // Obtiene un Driven por id junto con sus vehículos asociados.
  async findDrivenWithVehicleById(id: number) {
    const driven = await this.prisma.driven.findUnique({
      where: { id },
      include: { vehicles: true },
    });

    if (!driven) {
      throw new NotFoundException(`Driven with id ${id} not found`);
    }

    return {
      id: driven.id,
      name: driven.name,
      vehicles: driven.vehicles.map((vehicle) => ({
        id: vehicle.id,
        name: vehicle.name,
      })),
    };
  }
}
