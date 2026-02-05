import { DrivenCourseStatus } from '@prisma/client';

export const COURSE_STATUS_TRANSITIONS: Record<DrivenCourseStatus, DrivenCourseStatus[]> = {
  [DrivenCourseStatus.IN_PROGRESS]: [DrivenCourseStatus.COMPLETED, DrivenCourseStatus.CANCELED],
  [DrivenCourseStatus.COMPLETED]: [],
  [DrivenCourseStatus.CANCELED]: [],
};

// Función de validación
export function isValidTransition(current: DrivenCourseStatus, next: DrivenCourseStatus): boolean {
  return COURSE_STATUS_TRANSITIONS[current]?.includes(next) ?? false;
}
