import type { AppData } from "./data";

export interface ThrownResponse<
  Status extends number = number,
  Data = AppData
> {
  status: Status;
  statusText: string;
  data: Data;
}

export interface SerializedError {
  message: string;
  stack?: string;
}
