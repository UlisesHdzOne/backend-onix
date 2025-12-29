export type VehicleSummaryDto = {
  id: number;
  name: string;
};

export type DrivenDto = {
  id: number;
  name: string;
  vehicles?: VehicleSummaryDto[];
};
