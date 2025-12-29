import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  createVehicle(@Body() body: CreateVehicleDto) {
    return this.vehiclesService.createVehicle(body); // Crea un vehicle
  }

  @Get()
  findAllVehicles() {
    return this.vehiclesService.findAllVehicles(); // Obtiene todos los vehicles
  }

  @Patch(':id')
  updateVehicle(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateVehicleDto) {
    return this.vehiclesService.updateVehicle(id, body); // Actualiza un vehicle por id
  }

  @Get('with-driven')
  findVehicleByIdWithDriven() {
    return this.vehiclesService.findAllVehiclesWithDriven(); // Obtiene todos los vehicles con su driven asociado
  }

  @Get(':id')
  findVehicleById(@Param('id', ParseIntPipe) id: number) {
    return this.vehiclesService.findVehicleById(id); // Obtiene un vehicle por id
  }

  @Delete(':id')
  removeVehicle(@Param('id', ParseIntPipe) id: number) {
    return this.vehiclesService.removeVehicle(id); // Elimina un vehicle por id
  }

  @Patch(':id/assign-driven/:drivenId')
  assignDrivenToVehicle(
    @Param('id', ParseIntPipe) id: number,
    @Param('drivenId', ParseIntPipe) drivenId: number,
  ) {
    return this.vehiclesService.assignDrivenToVehicle(id, drivenId); // Asigna un driven a un vehicle
  }
}
