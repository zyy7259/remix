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

// Convert the Remix AssetsManifest into DataRouteObject's for use with
// DataStaticRouter
export function createStaticRouterDataRoutes(
  manifest: RouteManifest<EntryRoute>,
  routeModules: RouteModules,
  parentId?: string
): DataRouteObject[] {
  return Object.values(manifest)
    .filter((route) => route.parentId === parentId)
    .map((route) => ({
      caseSensitive: route.caseSensitive,
      children: createStaticRouterDataRoutes(manifest, routeModules, route.id),
      element: <RemixRoute id={route.id} />,
      errorElement:
        route.id === "root" ||
        routeModules[route.id].ErrorBoundary ||
        routeModules[route.id].CatchBoundary ? (
          <RemixRouteError id={route.id} />
        ) : undefined,
      id: route.id,
      index: route.index,
      path: route.path,
      // Note: we don't need loader/action/shouldRevalidate on these routes
      // since they're for a static render
      handle: routeModules[route.id].handle,
    }));
}

// Convert the Remix AssetsManifest into DataRouteObject's for use with
// DataBrowserRouter
export function createBrowserRouterDataRoutes(
  manifest: RouteManifest<EntryRoute>,
  routeModules: RouteModules,
  parentId?: string
): DataRouteObject[] {
  return Object.values(manifest)
    .filter((route) => route.parentId === parentId)
    .map((route) => {
      let fetchLoader = createLoader(route, routeModules);
      let loader: LoaderFunction = async ({ request, params }) => {
        // TODO: Note that we don't have GET submissions anymore - anything we
        // need to do for backwards compatibility?
        let result = await fetchLoader({ request, params });
        return result;
      };

      let action: ActionFunction | undefined = undefined;
      if (route.hasAction) {
        let fetchAction = createAction(route, routeModules);
        let clientAction: ActionFunction = async ({ request, params }) => {
          let result = await fetchAction({ request, params });
          return result;
        };
        action = clientAction;
      }

      return {
        caseSensitive: route.caseSensitive,
        children: createBrowserRouterDataRoutes(
          manifest,
          routeModules,
          route.id
        ),
        element: <RemixRoute id={route.id} />,
        errorElement: <RemixRouteError id={route.id} />,
        id: route.id,
        index: route.index,
        path: route.path,
        action,
        loader,
        // TODO: Implement this
        shouldRevalidate: undefined,
      };
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
