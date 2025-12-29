import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProfileDto } from './dto/create-profile.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { DrivenService } from '../../modules/driven/driven.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly drivenService: DrivenService,
  ) {}

  // ================================
  // CRUD PRINCIPAL
  // ================================

  // Crea un Profile y lo asocia a un Driven.
  async createProfile(drivenId: number, dto: CreateProfileDto) {
    await this.drivenService.findDrivenById(drivenId);
    await this.ensureDrivenHasNoProfile(drivenId);

    return this.prisma.profile.create({
      data: {
        bio: dto.bio,
        driven: {
          connect: { id: drivenId },
        },
      },
    });
  }

  // Obtiene un Profile usando el id del Driven.
  async findProfileByDrivenId(drivenId: number) {
    const profile = await this.prisma.profile.findUnique({
      where: { drivenId },
      include: { driven: true },
    });

    if (!profile) {
      throw new NotFoundException(`Profile with driven id ${drivenId} not found`);
    }

    return profile;
  }

  // Actualiza un Profile existente.
  async updateProfile(profileId: number, dto: UpdateProfileDto) {
    await this.findProfileById(profileId);

    return this.prisma.profile.update({
      where: { id: profileId },
      data: { bio: dto.bio },
    });
  }

  // Elimina un Profile existente.
  async removeProfile(profileId: number) {
    await this.findProfileById(profileId);
    return this.prisma.profile.delete({ where: { id: profileId } });
  }

  // ================================
  // MÉTODOS DE VALIDACIÓN / EXISTENCIA
  // ================================

  // Valida que un Profile exista por su id.
  // Se usa como guard en update y delete.
  async findProfileById(profileId: number) {
    const profile = await this.prisma.profile.findUnique({
      where: { id: profileId },
    });

    if (!profile) {
      throw new NotFoundException(`Profile with id ${profileId} not found`);
    }

    return profile;
  }

  // ================================
  // REGLAS DE NEGOCIO
  // ================================

  // Regla de dominio 1–1.
  // Valida que un Driven no tenga ya un Profile asociado.
  async ensureDrivenHasNoProfile(drivenId: number) {
    // Verifica si existe un Profile asociado al Driven.
    const profile = await this.prisma.profile.findUnique({
      where: { drivenId },
    });

    // Si existe, se viola la relación 1–1.
    if (profile) {
      throw new ConflictException(`Driven with id ${drivenId} already has a profile`);
    }
  }
}
