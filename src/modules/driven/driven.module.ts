import { Module } from '@nestjs/common';
import { DrivenService } from './driven.service';
import { DrivenController } from './driven.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DrivenController],
  providers: [DrivenService],
  exports: [DrivenService], // permite que el servicio sea inyectado en otros modulos
})
export class DrivenModule {}
