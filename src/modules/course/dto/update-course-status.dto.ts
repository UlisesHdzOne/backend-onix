import { IsEnum } from 'class-validator';
import { CourseStatus } from '../domain/course-status.enum';

export class UpdateCourseStatusDto {
  @IsEnum(CourseStatus, {
    message: 'Status must be one of: IN_PROGRESS, COMPLETED, CANCELED',
  })
  status!: CourseStatus;
}
