import { Body, Controller, Get, Param, Patch, Post, Delete, ParseIntPipe } from '@nestjs/common';
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
  findAllDriven() {
    return this.drivenService.findAllDriven(); // Obtiene todos los drivens
  }

  @Get('with-vehicles')
  findAllDrivenWithVehicle() {
    return this.drivenService.findAllDrivenWithVehicle(); // Obtiene todos los drivens con sus vehículos
  }

  @Get(':id')
  findDrivenById(@Param('id', ParseIntPipe) id: number) {
    return this.drivenService.findDrivenById(id); // Obtiene un driven por ID
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
