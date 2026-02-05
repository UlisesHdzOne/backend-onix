import { CourseLifecycleStatus } from '@prisma/client';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateCourseDto {
  @IsString()
  // @Length(1, 50)
  @IsOptional()
  // @Matches(/\S/, { message: 'Name cannot be empty' })
  name?: string;

  @IsString()
  @IsOptional()
  // @Length(0, 255) // 0 es para que pueda ser nulo
  description?: string | null;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsEnum(CourseLifecycleStatus)
  @IsOptional()
  status?: CourseLifecycleStatus;

  @IsOptional()
  @IsNumber()
  @Min(1)
  durationHours?: number;
}
