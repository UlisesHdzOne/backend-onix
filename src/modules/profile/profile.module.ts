import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { DrivenModule } from '../../modules/driven/driven.module';

@Module({
  imports: [PrismaModule, DrivenModule],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
