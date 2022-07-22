import type { StaticHandlerContext } from "@remix-run/router";

import type {
  RouteManifest,
  ServerRouteManifest,
  EntryRoute,
  ServerRoute,
} from "./routes";
import type { RouteMatch } from "./routeMatching";
import type { RouteModules, EntryRouteModule } from "./routeModules";

// Object passed to RemixContext.Provider
export interface RemixContextObject {
  manifest: AssetsManifest;
  routeModules: RouteModules<EntryRouteModule>;
  serverHandoffString?: string;
}

// Additional React-Router information needed at runtime, but not hydrated
// through RemixContext
export interface EntryContext extends RemixContextObject {
  staticHandlerContext: StaticHandlerContext;
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
