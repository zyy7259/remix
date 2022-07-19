import type { AppData } from "./data";

export interface AppState {
  unhandledBoundaryError: SerializedError | ThrownResponse | null;
  deepestCatchBoundaryId: string | null;
  deepestErrorBoundaryId: string | null;
}

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
