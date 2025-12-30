import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateDrivenDto } from './dto/create-driven.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateDrivenDto } from './dto/update-driven.dto';
import { DrivenResponse } from './types/driven.response';

@Injectable()
export class DrivenService {
  constructor(private readonly prisma: PrismaService) {}

  // ================================
  // CRUD PRINCIPAL
  // ================================

  // Crea un Driven.
  async createDriven(dto: CreateDrivenDto) {
    await this.validateDrivenNameNotExists(dto.name);
    return this.prisma.driven.create({ data: { name: dto.name } });
  }

  // Obtiene todos los Drivens.
  async findAllDriven(): Promise<DrivenResponse[]> {
    const drivens = await this.prisma.driven.findMany();
    return drivens.map((driven) => ({
      id: driven.id,
      name: driven.name,
    }));
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
  async updateDriven(id: number, dto: UpdateDrivenDto) {
    const current = await this.findDrivenById(id);

    // Si el nombre es diferente al actual
    if (dto.name && dto.name !== current.name) {
      await this.validateDrivenNameNotExists(dto.name);
    }

    return this.prisma.driven.update({
      where: { id },
      data: dto,
    });
  }

  // Elimina un Driven.
  async removeDriven(id: number) {
    const driven = await this.findDrivenById(id);

    if (driven.vehicles.length > 0) {
      throw new ConflictException(`Driven with id ${id} has vehicles`);
    }

    if (driven.profile) {
      throw new ConflictException(`Driven with id ${id} has a profile`);
    }

    return this.prisma.driven.delete({ where: { id } });
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
  async findDrivenById(id: number) {
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
}
