import * as React from "react";
import type { DataRouteObject } from "@remix-run/router";
import { isRouteErrorResponse } from "@remix-run/router";
import type { LoaderFunction, ActionFunction } from "react-router-dom";
import { useRouteError, useLocation } from "react-router-dom";

import type { RouteModules } from "./routeModules";
import type { EntryRoute, RouteManifest } from "./routes";
import { createAction, createLoader } from "./routes";
import { RemixCatchBoundary, RemixErrorBoundary } from "./errorBoundaries";
import { RemixRoute, useRemixEntryContext } from "./components";
import invariant from "./invariant";

// TODO:
// - Start removing things from RemixEntryContext in favor of using data router versions
// - map out data flow of manifest -> routes -> router -> context
//   - server
//     - EntryContext created in handleDocumentRequest
//     -> entry.server.tsx
//     -> <RemixServer>
//     -> <RemixEntry> (inside of <DataStaticRouter>)
//     -> <Scripts> generates window.__remixContext from serverHandoffString
//   - client
//     - entry.client.tsx renders <RemixBrowser>
//     -> <RemixBrowser> reads window.__remixContext
//     -> <RemixEntry> (inside of <WithDataRouter>)
// - handle credentials on requests
// - distinguish catch and error boundaries
// - handle infinite loop on error boundaries

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
  let { routeModules } = useRemixEntryContext();

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

  if (isCatch && CatchBoundary) {
    console.log("Rendering errorElement as a CatchBoundary", id, error);
    return <RemixCatchBoundary component={CatchBoundary} catch={error} />;
  }

  if (!isCatch && ErrorBoundary) {
    console.log("Rendering errorElement as an ErrorBoundary", id, error);
    return (
      <RemixErrorBoundary
        location={location}
        component={ErrorBoundary}
        error={error}
      />
    );
  }

  console.log("Re-throwing error to higher Catch/Error Boundary", id);
  throw error;
}
