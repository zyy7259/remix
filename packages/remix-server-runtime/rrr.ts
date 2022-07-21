import type { DataRouteObject, StaticHandlerContext } from "@remix-run/router";
import { isRouteErrorResponse } from "@remix-run/router";
import { ServerBuild } from "./build";

import type { AppLoadContext } from "./data";
import { callRouteAction, callRouteLoader } from "./data";
import type { ServerRouteManifest } from "./routes";

export function createServerDataRoutes(
  manifest: ServerRouteManifest,
  loadContext?: AppLoadContext,
  parentId?: string
): DataRouteObject[] {
  return Object.entries(manifest)
    .filter(([, route]) => route.parentId === parentId)
    .map(([id, route]) => ({
      caseSensitive: route.caseSensitive,
      children: createServerDataRoutes(manifest, loadContext, id),
      // TODO: We're on the server here and are currently framework agnostic.
      // Add true here and then once we get into UI land we can adapt with the
      // right components
      // TODO: Look at removing these for the router usage
      element: route.module.default != null,
      errorElement:
        // We will always handle errors ar the root, since we have
        // default boundaries
        route.id === "root" ||
        route.module.CatchBoundary != null ||
        route.module.ErrorBoundary != null,
      id: route.id,
      index: route.index,
      path: route.path,
      loader: route.module.loader
        ? (args) => callRouteLoader({ ...args, route, loadContext })
        : undefined,
      action: route.module.action
        ? (args) => callRouteAction({ ...args, route, loadContext })
        : undefined,
      handle: route.module.handle,
      // TODO: Implement!
      shouldRevalidate: () => true,
    }));
}

function findParentBoundary(
  routes: ServerRouteManifest,
  routeId: string,
  error: any
): string {
  let route = routes[routeId];
  let isCatch = isRouteErrorResponse(error);
  if (
    (isCatch && route.module.CatchBoundary) ||
    (!isCatch && route.module.ErrorBoundary) ||
    !route.parentId
  ) {
    return routeId;
  }

  return findParentBoundary(routes, route.parentId, error);
}

// Re-generate a remix-friendly context.errors structure.  The Router only
// handles generic errors and does not distinguish error versus catch.  We
// may have a thrown response tagged to a route that only exports an
// ErrorBoundary or vice versa.  So we adjust here and ensure that
// data-loading errors are properly associated with routes that have the right
// type of boundaries.
export function differentiateCatchVersusErrorBoundaries(
  build: ServerBuild,
  context: StaticHandlerContext
) {
  if (context.errors) {
    let errors: Record<string, any> = {};
    for (let routeId of Object.keys(context.errors)) {
      let error = context.errors[routeId];
      let handlingRouteId = findParentBoundary(build.routes, routeId, error);
      errors[handlingRouteId] = error;
    }
    context.errors = errors;
  }
}
