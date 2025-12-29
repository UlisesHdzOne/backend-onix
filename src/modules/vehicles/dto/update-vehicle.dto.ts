import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateVehicleDto {
  @IsString()
  @IsOptional()
  @Length(1, 50)
  name?: string;
}
