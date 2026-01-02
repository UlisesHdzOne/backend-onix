import { CourseStatus } from '@prisma/client';

export const COURSE_STATUS_TRANSITIONS: Record<CourseStatus, CourseStatus[]> = {
  [CourseStatus.IN_PROGRESS]: [CourseStatus.COMPLETED, CourseStatus.CANCELED],
  [CourseStatus.COMPLETED]: [],
  [CourseStatus.CANCELED]: [],
};

// Función de validación
export function isValidTransition(current: CourseStatus, next: CourseStatus): boolean {
  return COURSE_STATUS_TRANSITIONS[current]?.includes(next) ?? false;
}
