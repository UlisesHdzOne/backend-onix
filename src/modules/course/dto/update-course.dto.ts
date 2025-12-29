import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class UpdateCourseDto {
  @IsString()
  @Length(1, 50)
  @IsOptional()
  name?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
