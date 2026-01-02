import { CourseStatus } from '@prisma/client';

export const COURSE_STATUS_TRANSITIONS: Record<CourseStatus, CourseStatus[]> = {
  IN_PROGRESS: [CourseStatus.COMPLETED, CourseStatus.CANCELED],
  COMPLETED: [],
  CANCELED: [],
};
