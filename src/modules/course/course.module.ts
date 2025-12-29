import { Module } from '@nestjs/common';
import { CourseService } from './course.service';
import { CourseController } from './course.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { DrivenService } from '../../modules/driven/driven.service';

@Module({
  imports: [PrismaModule],
  controllers: [CourseController],
  providers: [CourseService, DrivenService],
})
export class CourseModule {}
