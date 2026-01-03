import { IsEnum } from 'class-validator';
import { InstructorStatus } from '@prisma/client';

export class UpdateInstructorStatusDto {
  @IsEnum(InstructorStatus, {
    message: 'Status must be one of: ACTIVE, ON_LEAVE, INACTIVE',
  })
  status!: InstructorStatus;
}
