import { CourseStatus } from '@prisma/client';

export type CourseResponse = {
  id: number;
  name: string;
  isActive: boolean;
};

export type AssignCourseWithRelationsResponse = {
  id: number;
  status: CourseStatus;
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
  status: CourseStatus;
  progress: number;
  assignedAt: Date;
};
