import { IsEnum } from 'class-validator';
import { DrivenCourseStatus } from '@prisma/client';

export class UpdateCourseStatusDto {
  @IsEnum(DrivenCourseStatus, {
    message: 'Status must be one of: IN_PROGRESS, COMPLETED, CANCELED',
  })
  status!: DrivenCourseStatus;
}
