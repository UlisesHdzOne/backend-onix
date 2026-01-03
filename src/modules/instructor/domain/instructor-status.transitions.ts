import { InstructorStatus } from '@prisma/client';

export const INSTRUCTOR_STATUS_TRANSITIONS_INSTRUCTOR: Record<
  InstructorStatus,
  InstructorStatus[]
> = {
  [InstructorStatus.ACTIVE]: [InstructorStatus.ON_LEAVE, InstructorStatus.INACTIVE],
  [InstructorStatus.ON_LEAVE]: [InstructorStatus.ACTIVE, InstructorStatus.INACTIVE],
  [InstructorStatus.INACTIVE]: [],
};

export function isValidTransitionInstructor(
  current: InstructorStatus,
  next: InstructorStatus,
): boolean {
  return INSTRUCTOR_STATUS_TRANSITIONS_INSTRUCTOR[current]?.includes(next) ?? false;
}
