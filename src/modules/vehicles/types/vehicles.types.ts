export type DrivenSummaryDto = {
  id: number;
  name: string;
};

export type VehicleDto = {
  id: number;
  name: string;
  driven?: DrivenSummaryDto[];
};
