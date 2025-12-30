export type VehicleSummaryResponse = {
  id: number;
  name: string;
};

export type DrivenResponse = {
  id: number;
  name: string;
  vehicles?: VehicleSummaryResponse[];
};
