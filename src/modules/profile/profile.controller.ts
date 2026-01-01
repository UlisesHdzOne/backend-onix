import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Patch } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post(':drivenId')
  createProfile(@Param('drivenId', ParseIntPipe) drivenId: number, @Body() body: CreateProfileDto) {
    return this.profileService.createProfile(drivenId, body); // Crea un profile y lo asocia a un driven
  }

  @Get('driven/:drivenId')
  findProfileByDrivenId(@Param('drivenId', ParseIntPipe) drivenId: number) {
    return this.profileService.findProfileByDrivenId(drivenId); // Obtiene un profile por su id
  }

  @Patch(':id')
  updateProfile(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateProfileDto) {
    return this.profileService.updateProfile(id, body); // Actualiza el bio de un profile
  }

  @Delete(':id')
  removeProfile(@Param('id', ParseIntPipe) id: number) {
    return this.profileService.removeProfile(id); // Elimina un profile por id
  }
}
