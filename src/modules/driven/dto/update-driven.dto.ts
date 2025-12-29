import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateDrivenDto {
  @IsString()
  @IsOptional()
  @Length(1, 50)
  name?: string;
}
