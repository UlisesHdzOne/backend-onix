import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateInstructorDto {
  @IsString()
  @Length(1, 50)
  @IsOptional()
  name?: string;

  @IsString()
  @Length(1, 50)
  @IsOptional()
  email?: string;
}
