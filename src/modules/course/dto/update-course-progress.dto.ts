import { IsInt, Min, Max } from 'class-validator';

export class UpdateCourseProgressDto {
  @IsInt()
  @Min(0)
  @Max(100)
  progress!: number;
}
