import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Delete,
  ParseIntPipe,
  Query,
  DefaultValuePipe,
} from '@nestjs/common';
import { DrivenService } from './driven.service';
import { CreateDrivenDto } from './dto/create-driven.dto';
import { UpdateDrivenDto } from './dto/update-driven.dto';

@Controller('driven')
export class DrivenController {
  constructor(private readonly drivenService: DrivenService) {}

  @Post()
  createDriven(@Body() body: CreateDrivenDto) {
    return this.drivenService.createDriven(body); // Crea un nuevo driven
  }

  @Get()
  findAllDriven(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.drivenService.findAllDriven(page, limit); // Obtiene todos los drivens con paginación
  }

  @Get('with-vehicles')
  findAllDrivenWithVehicle() {
    return this.drivenService.findAllDrivenWithVehicle(); // Obtiene todos los drivens con sus vehículos
  }

  @Patch(':id')
  updateDriven(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateDrivenDto) {
    return this.drivenService.updateDriven(id, body); // Actualiza un driven existente
  }

  @Delete(':id')
  removeDriven(@Param('id', ParseIntPipe) id: number) {
    return this.drivenService.removeDriven(id); // Elimina un driven por ID
  }
}
