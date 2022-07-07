import type {
  DataRouteMatch,
  DataRouteObject,
  Location,
} from "@remix-run/router";

import type { AppState } from "./errors";
import type { RouteManifest, EntryRoute } from "./routes";
import type { RouteData } from "./routeData";
import type { RouteMatch } from "./routeMatching";
import type { RouteModules } from "./routeModules";

export interface EntryContext {
  appState: AppState;
  manifest: AssetsManifest;
  matches: RouteMatch<EntryRoute>[];
  routeData: RouteData;
  actionData?: RouteData;
  routeModules: RouteModules;
  serverHandoffString?: string;

  // New fields for data router
  dataRoutes: DataRouteObject[];
  dataLocation: Location;
  dataMatches: DataRouteMatch[];
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
