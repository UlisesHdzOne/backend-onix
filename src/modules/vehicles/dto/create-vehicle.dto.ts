import { IsString, Length } from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  @Length(1, 50)
  name!: string;
}
