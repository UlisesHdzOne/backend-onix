import { IsString, Length } from 'class-validator';

export class CreateDrivenDto {
  @IsString()
  @Length(1, 50)
  name!: string;
}
