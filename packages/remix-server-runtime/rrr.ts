import * as React from "react";
import type {
  ActionFunctionArgs,
  DataRouteMatch,
  DataRouteObject,
  LoaderFunctionArgs,
} from "@remix-run/router";
import { invariant } from "@remix-run/router";

import type { AppLoadContext } from "./data";
import { callRouteAction, callRouteLoader } from "./data";
import type { ServerRoute, ServerRouteManifest } from "./routes";
import { createRoutes } from "./routes";
import type { RouteMatch } from "./routeMatching";

export function createServerDataRoute(
  routeId: string,
  route: Omit<ServerRoute, "children">,
  manifest: ServerRouteManifest,
  loadContext?: AppLoadContext
): DataRouteObject {
  let loader = route.module.loader
    ? ({ request, params }: LoaderFunctionArgs) =>
        callRouteLoader({ request, route, params, loadContext })
    : undefined;
  let action = route.module.action
    ? ({ request, params }: ActionFunctionArgs) =>
        callRouteAction({ request, route, params, loadContext })
    : undefined;
  return {
    caseSensitive: route.caseSensitive,
    children: createServerDataRoutes(manifest, loadContext, routeId),
    element: route.module.default
      ? React.createElement(route.module.default)
      : null,
    id: route.id,
    index: route.index,
    path: route.path,
    loader,
    action,
    // TODO: Implement!
    errorElement: null,
    handle: route.module.handle,
    // TODO: Implement!
    shouldRevalidate: () => true,
  };
}

export function createServerDataRoutes(
  manifest: ServerRouteManifest,
  loadContext?: AppLoadContext,
  parentId?: string
): DataRouteObject[] {
  return Object.entries(manifest)
    .filter(([, route]) => route.parentId === parentId)
    .map(([id, route]) =>
      createServerDataRoute(id, route, manifest, loadContext)
    );
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
