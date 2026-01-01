export type DrivenResponse = {
  id: number;
  name: string;
};

export type VehicleResponse = {
  id: number;
  name: string;
  driven?: DrivenResponse;
};
