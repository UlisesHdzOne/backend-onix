import { Module } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { VehiclesController } from './vehicles.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { DrivenModule } from '../driven/driven.module';

@Module({
  imports: [PrismaModule, DrivenModule], // DrivenModule para usarlo el servicio
  controllers: [VehiclesController],
  providers: [VehiclesService],
})
export class VehiclesModule {}
