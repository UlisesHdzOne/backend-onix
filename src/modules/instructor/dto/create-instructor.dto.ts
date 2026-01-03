import { IsString, Length } from 'class-validator';

export class CreateInstructorDto {
  @IsString()
  @Length(1, 50)
  name!: string;

  @IsString()
  @Length(1, 50)
  email!: string;
}
