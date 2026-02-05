import { IsInt, IsOptional, IsString, Length, MaxLength, Min } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  @Length(1, 50)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationHours?: number;
}
