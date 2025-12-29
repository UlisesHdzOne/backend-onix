// src/modules/course/dto/update-course-status.dto.ts
import { IsEnum } from 'class-validator';

// Define el enum aquí mismo
export enum CourseStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
}

export class UpdateCourseStatusDto {
  @IsEnum(CourseStatus, {
    message: 'Status must be one of: IN_PROGRESS, COMPLETED, CANCELED',
  })
  status!: CourseStatus; // El ! soluciona el error de inicialización
}
