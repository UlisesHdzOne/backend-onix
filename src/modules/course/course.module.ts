import { Module } from '@nestjs/common';
import { CourseService } from './course.service';
import { CourseController } from './course.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { DrivenModule } from '../../modules/driven/driven.module';

@Module({
  imports: [PrismaModule, DrivenModule],
  controllers: [CourseController],
  providers: [CourseService],
})
export class CourseModule {}
