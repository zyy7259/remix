import * as React from "react";
import type { DataRouteObject } from "@remix-run/router";
import type { LoaderFunction, ActionFunction } from "react-router-dom";

import type { RouteModules } from "./routeModules";
import type {
  EntryRoute,
  RemixRouteComponentType,
  RouteManifest,
} from "./routes";
import { createAction, createLoader } from "./routes";

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
  routeModulesCache: RouteModules,
  Component: RemixRouteComponentType
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
    element: <Component id={entryRoute.id} />,
    id: entryRoute.id,
    path: entryRoute.path,
    index: entryRoute.index,
    loader,
    action,
    // TODO: Implement this
    shouldRevalidate: undefined,
    // TODO: Implement this
    errorElement: undefined,
  };
}

export function createClientDataRoutes(
  routeManifest: RouteManifest<EntryRoute>,
  routeModulesCache: RouteModules,
  Component: RemixRouteComponentType,
  parentId?: string
): DataRouteObject[] {
  return Object.keys(routeManifest)
    .filter((key) => routeManifest[key].parentId === parentId)
    .map((key) => {
      let route = createClientDataRoute(
        routeManifest[key],
        routeModulesCache,
        Component
      );
      let children = createClientDataRoutes(
        routeManifest,
        routeModulesCache,
        Component,
        route.id
      );
      if (children.length > 0) route.children = children;
      return route;
    });
}
