import { IsString, Length } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  @Length(1, 50)
  name!: string;
}
