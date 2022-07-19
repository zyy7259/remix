import type {
  DataRouteMatch,
  DataRouteObject,
  HydrationState,
  Location,
} from "@remix-run/router";

import type { AppState } from "./errors";
import type { RouteManifest, EntryRoute } from "./routes";
import type { RouteModules } from "./routeModules";

export interface EntryContext {
  // Compiler information to communicate up to the client
  manifest: AssetsManifest;
  routeModules: RouteModules;

  // Render-time mutable state, used to emulate componentDidCatch during SSR
  appState: AppState;

  // Data/Errors from SSR fetches that we need to hydrate up to the client
  hydrationData: HydrationState;

  // Serialized version of hydrationData
  serverHandoffString?: string;

  // Stateful information about the router that we need during SSR but don't
  // need to hydrate
  routerState: {
    routes: DataRouteObject[];
    location: Location;
    matches: DataRouteMatch[];
  };
}

export interface AssetsManifest {
  entry: {
    imports: string[];
    module: string;
  };
  routes: RouteManifest<EntryRoute>;
  url: string;
  version: string;
}
