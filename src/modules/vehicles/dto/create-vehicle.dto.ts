import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  @Length(5, 50)
  name!: string;
}
