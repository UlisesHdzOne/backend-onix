import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProfileDto } from './dto/create-profile.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { DrivenService } from '../../modules/driven/driven.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileResponse } from './type/profile.response';

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
  async createProfile(drivenId: number, dto: CreateProfileDto): Promise<ProfileResponse> {
    await this.drivenService.ensureDrivenExists(drivenId);
    await this.ensureDrivenHasNoProfile(drivenId);

    const profile = await this.prisma.profile.create({
      data: {
        bio: dto.bio,
        driven: {
          connect: { id: drivenId },
        },
      },
      select: { bio: true },
    });

    return profile;
  }

  // Obtiene un Profile usando el id del Driven.
  async findProfileByDrivenId(drivenId: number): Promise<ProfileResponse> {
    const profile = await this.prisma.profile.findUnique({
      where: { drivenId },
      select: { bio: true },
    });

    if (!profile) {
      throw new NotFoundException(`Profile with driven id ${drivenId} not found`);
    }

    return profile;
  }

  // Actualiza un Profile existente.
  async updateProfile(profileId: number, dto: UpdateProfileDto): Promise<ProfileResponse> {
    await this.findProfileById(profileId);

    const updated = this.prisma.profile.update({
      where: { id: profileId },
      data: { bio: dto.bio },
      select: { bio: true },
    });

    return updated;
  }

  // Elimina un Profile existente.
  async removeProfile(profileId: number): Promise<ProfileResponse> {
    await this.findProfileById(profileId);
    const deleted = await this.prisma.profile.delete({
      where: { id: profileId },
      select: { bio: true },
    });

    return deleted;
  }

  // ================================
  // MÉTODOS DE VALIDACIÓN / EXISTENCIA
  // ================================

  // Valida que un Profile exista por su id.
  // Se usa como guard en update y delete.
  private async findProfileById(profileId: number) {
    const profile = await this.prisma.profile.findUnique({
      where: { id: profileId },
      select: { id: true },
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
      select: { id: true }, // Solo necesitamos confirmar existencia
    });

    // Si existe, se viola la relación 1–1.
    if (profile) {
      throw new ConflictException(`Driven with id ${drivenId} already has a profile`);
    }
  }
}
