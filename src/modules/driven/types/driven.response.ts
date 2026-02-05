export type VehicleSummaryResponse = {
  id: number;
  name: string;
};

export type DrivenDetailResponse = {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  vehicles?: VehicleSummaryResponse[];
};

export type DrivenListItemResponse = {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};
