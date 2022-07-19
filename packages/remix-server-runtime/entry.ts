import type {
  DataRouteMatch,
  DataRouteObject,
  HydrationState,
  Location,
} from "@remix-run/router";

import type { AppState } from "./errors";
import type {
  RouteManifest,
  ServerRouteManifest,
  EntryRoute,
  ServerRoute,
} from "./routes";
import type { RouteMatch } from "./routeMatching";
import type { RouteModules, EntryRouteModule } from "./routeModules";

export interface EntryContext {
  // Compiler information to communicate up to the client
  manifest: AssetsManifest;
  routeModules: RouteModules<EntryRouteModule>;

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

export function createEntryMatches(
  matches: RouteMatch<ServerRoute>[],
  routes: RouteManifest<EntryRoute>
): RouteMatch<EntryRoute>[] {
  return matches.map((match) => ({
    params: match.params,
    pathname: match.pathname,
    route: routes[match.route.id],
  }));
}

export function createEntryRouteModules(
  manifest: ServerRouteManifest
): RouteModules<EntryRouteModule> {
  return Object.keys(manifest).reduce((memo, routeId) => {
    memo[routeId] = manifest[routeId].module;
    return memo;
  }, {} as RouteModules<EntryRouteModule>);
}
