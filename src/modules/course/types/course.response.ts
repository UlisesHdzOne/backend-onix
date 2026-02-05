import { CourseLifecycleStatus, DrivenCourseStatus } from '@prisma/client';

export type CourseResponse = {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  status: CourseLifecycleStatus;
  durationHours?: number;
};

export type DrivenCourseListItemResponse = {
  id: number;
  name: string;
  isActive: boolean;
  status: DrivenCourseStatus;
  progress: number;
  assignedAt: Date;
};

export type AssignCourseWithRelationsResponse = {
  id: number;
  status: DrivenCourseStatus;
  assignedAt: Date;

  course: {
    id: number;
    name: string;
  };
};

export type UpdateCourseStatusResponse = {
  id: number;
  drivenId: number;
  courseId: number;
  status: DrivenCourseStatus;
  progress: number;
  assignedAt: Date;
};
