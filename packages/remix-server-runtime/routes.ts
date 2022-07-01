import type { DataRouteObject, DataRouteMatch } from "@remix-run/router";

import type { AppLoadContext } from "./data";
import { callRouteAction, callRouteLoader } from "./data";
import invariant from "./invariant";
import type { RouteMatch } from "./routeMatching";
import type { ServerRouteModule } from "./routeModules";

export interface RouteManifest<Route> {
  [routeId: string]: Route;
}

export type ServerRouteManifest = RouteManifest<Omit<ServerRoute, "children">>;

// NOTE: make sure to change the Route in remix-react if you change this
interface Route {
  index?: boolean;
  caseSensitive?: boolean;
  id: string;
  parentId?: string;
  path?: string;
}

// NOTE: make sure to change the EntryRoute in remix-react if you change this
export interface EntryRoute extends Route {
  hasAction: boolean;
  hasLoader: boolean;
  hasCatchBoundary: boolean;
  hasErrorBoundary: boolean;
  imports?: string[];
  module: string;
}

export interface ServerRoute extends Route {
  children: ServerRoute[];
  module: ServerRouteModule;
}

export function createRoutes(
  manifest: ServerRouteManifest,
  parentId?: string
): ServerRoute[] {
  return Object.entries(manifest)
    .filter(([, route]) => route.parentId === parentId)
    .map(([id, route]) => ({
      ...route,
      children: createRoutes(manifest, id),
    }));
}

export function createDataRoutes(
  manifest: ServerRouteManifest,
  loadContext?: AppLoadContext,
  parentId?: string
): DataRouteObject[] {
  return Object.entries(manifest)
    .filter(([, route]) => route.parentId === parentId)
    .map(([id, route]) => {
      let dataRoute: DataRouteObject = {
        caseSensitive: route.caseSensitive,
        children: createDataRoutes(manifest, loadContext, id),
        element: route.module.default,
        id: route.id,
        index: route.index,
        path: route.path,
        ...(route.module.loader
          ? {
              loader: ({ request, params }) =>
                callRouteLoader({ request, route, params, loadContext }),
            }
          : {}),
        ...(route.module.action
          ? {
              action: ({ request, params }) =>
                callRouteAction({ request, route, params, loadContext }),
            }
          : {}),
        errorElement: null,
        handle: route.module.handle,
        // TODO:
        shouldRevalidate: () => true,
      };
      return dataRoute;
    });
}

export function convertRouterMatchesToServerMatches(
  routerMatches: DataRouteMatch[],
  routes: ServerRouteManifest
): RouteMatch<ServerRoute>[] {
  let matches: RouteMatch<ServerRoute>[] = routerMatches.map((match, index) => {
    let parentId = index > 0 ? routerMatches[index - 1].route.id : undefined;
    let serverRoute = createRoutes(routes, parentId).find(
      (r) => r.id === match.route.id
    );
    // TODO: clean this up
    invariant(serverRoute, "Couldn't find server route");
    let serverMatch: RouteMatch<ServerRoute> = {
      params: match.params,
      pathname: match.pathname,
      route: serverRoute,
    };
    return serverMatch;
  });
  return matches;
}
