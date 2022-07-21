import * as React from "react";
import type { DataRouteObject } from "@remix-run/router";
import { isRouteErrorResponse } from "@remix-run/router";
import type { LoaderFunction, ActionFunction } from "react-router-dom";
import { useRouteError, useLocation } from "react-router-dom";

import type { RouteModules } from "./routeModules";
import type { EntryRoute, RouteManifest } from "./routes";
import { createAction, createLoader } from "./routes";
import {
  RemixCatchBoundary,
  RemixErrorBoundary,
  RemixRootDefaultCatchBoundary,
  RemixRootDefaultErrorBoundary,
} from "./errorBoundaries";
import { RemixRoute, useRemixContext } from "./components";
import invariant from "./invariant";

// TODO:
// - handle credentials on requests

// TODO: route breakdown - how best to type these?
// server
// manifest routes (knows about modules)                   agnostic
// createRouter routes (knows errorBoundary: true)         agnostic
// data static router routes (knows element/errorElement)  framework specific

// client
// over the wire manifest routes (knows about modules)     agnostic
// data browser routes (knows element/errorElement)        framework specific

export function createClientDataRoute(
  entryRoute: EntryRoute,
  routeModulesCache: RouteModules
): DataRouteObject {
  let fetchLoader = createLoader(entryRoute, routeModulesCache);
  let loader: LoaderFunction = async ({ request, params }) => {
    // TODO: Note that we don't have GET submissions anymore - anything we
    // need to do for backwards compatibility?
    let result = await fetchLoader({ request, params });
    return result;
  };

  let action: ActionFunction | undefined = undefined;
  if (entryRoute.hasAction) {
    let fetchAction = createAction(entryRoute, routeModulesCache);
    let clientAction: ActionFunction = async ({ request, params }) => {
      let result = await fetchAction({ request, params });
      return result;
    };
    action = clientAction;
  }

  return {
    caseSensitive: !!entryRoute.caseSensitive,
    element: <RemixRoute id={entryRoute.id} />,
    errorElement: <RemixRouteError id={entryRoute.id} />,
    id: entryRoute.id,
    path: entryRoute.path,
    index: entryRoute.index,
    loader,
    action,
    // TODO: Implement this
    shouldRevalidate: undefined,
  };
}

export function createClientDataRoutes(
  routeManifest: RouteManifest<EntryRoute>,
  routeModulesCache: RouteModules,
  parentId?: string
): DataRouteObject[] {
  return Object.keys(routeManifest)
    .filter((key) => routeManifest[key].parentId === parentId)
    .map((key) => {
      let route = createClientDataRoute(routeManifest[key], routeModulesCache);
      let children = createClientDataRoutes(
        routeManifest,
        routeModulesCache,
        route.id
      );
      if (children.length > 0) route.children = children;
      return route;
    });
}

export function RemixRouteError({ id }: { id: string }) {
  let { routeModules } = useRemixContext();

  // This checks prevent cryptic error messages such as: 'Cannot read properties of undefined (reading 'root')'
  invariant(
    routeModules,
    "Cannot initialize 'routeModules'. This normally occurs when you have server code in your client modules.\n" +
      "Check this link for more details:\nhttps://remix.run/pages/gotchas#server-code-in-client-bundles"
  );

  let error = useRouteError();
  let location = useLocation();
  let isCatch = isRouteErrorResponse(error);

  let { CatchBoundary, ErrorBoundary } = routeModules[id];

  // Provide defaults for the root route if they are not present
  if (id === "root") {
    CatchBoundary ||= RemixRootDefaultCatchBoundary;
    ErrorBoundary ||= RemixRootDefaultErrorBoundary;
  }

  if (isCatch && CatchBoundary) {
    return <RemixCatchBoundary component={CatchBoundary} catch={error} />;
  }

  if (!isCatch && ErrorBoundary) {
    return (
      <RemixErrorBoundary
        location={location}
        component={ErrorBoundary}
        error={error}
      />
    );
  }

  throw error;
}
