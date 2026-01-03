import { InstructorStatus } from '@prisma/client';

export type InstructorResponse = {
  id: number;
  name: string;
  email: string;
  status: InstructorStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type PaginatedInstructorResponse = {
  data: InstructorResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};
