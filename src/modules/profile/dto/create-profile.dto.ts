import { IsString, Length } from 'class-validator';

export class CreateProfileDto {
  @IsString()
  @Length(1, 50)
  bio!: string;
}
