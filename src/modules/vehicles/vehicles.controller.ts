import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
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
  findAllVehicles(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('drivenId') drivenId?: string, // ← Recibe como string
  ) {
    // Lógica para manejar drivenId
    let drivenIdFilter: number | null | undefined = undefined;

    if (drivenId !== undefined) {
      if (drivenId.toLowerCase() === 'null' || drivenId === '') {
        // Caso 1: Buscar vehículos SIN conductor (disponibles)
        drivenIdFilter = null;
      } else {
        // Caso 2: Buscar vehículos de un conductor específico
        const parsed = parseInt(drivenId, 10);
        if (isNaN(parsed)) {
          throw new BadRequestException(
            'drivenId must be a valid number, "null" (for unassigned vehicles), or empty string',
          );
        }
        drivenIdFilter = parsed;
      }
    }
    // Caso 3: Si drivenId es undefined, no aplicamos filtro (todos los vehículos)

    return this.vehiclesService.findAllVehicles(page, limit, search, drivenIdFilter);
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

  // En vehicles.controller.ts
  @Patch(':id/unassign-driven')
  async unassignDrivenFromVehicle(@Param('id', ParseIntPipe) id: number) {
    return this.vehiclesService.unassignDrivenFromVehicle(id);
  }
}
