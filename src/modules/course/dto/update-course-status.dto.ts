import { IsEnum } from 'class-validator';
import { CourseStatus } from '@prisma/client';

export class UpdateCourseStatusDto {
  @IsEnum(CourseStatus, {
    message: 'Status must be one of: IN_PROGRESS, COMPLETED, CANCELED',
  })
  status!: CourseStatus;
}
