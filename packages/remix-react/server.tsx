import type { StaticHandlerContext } from "@remix-run/router";
import type { DataRouteObject } from "@remix-run/router";
import type { ReactElement } from "react";
import * as React from "react";
import { DataStaticRouter } from "react-router-dom/server";

import { RemixEntry, RemixRoute } from "./components";
import type { EntryContext } from "./entry";
import type { RouteModules } from "./routeModules";
import { RemixRouteError } from "./rrr";

export interface RemixServerProps {
  context: EntryContext;
  url: string | URL;
}

function adaptElements(
  dataRoutes: DataRouteObject[],
  routeModules: RouteModules
) {
  return dataRoutes.map((dataRoute) => {
    let adaptedDataRoute: DataRouteObject = {
      ...dataRoute,
      element: dataRoute.element
        ? React.createElement(RemixRoute, { id: dataRoute.id })
        : undefined,
      errorElement: dataRoute.errorElement
        ? React.createElement(RemixRouteError, { id: dataRoute.id })
        : undefined,
      children:
        dataRoute.children != null
          ? adaptElements(dataRoute.children, routeModules)
          : undefined,
    };
    return adaptedDataRoute;
  });
}

/**
 * The entry point for a Remix app when it is rendered on the server (in
 * `app/entry.server.js`). This component is used to generate the HTML in the
 * response from the server.
 */
export function RemixServer({ context, url }: RemixServerProps): ReactElement {
  if (typeof url === "string") {
    url = new URL(url);
  }

  let staticContext: StaticHandlerContext = {
    location: context.routerState.location,
    matches: context.routerState.matches,
    loaderData: context.hydrationData.loaderData || {},
    actionData: context.hydrationData.actionData || null,
    errors: context.hydrationData.errors || null,
  };

  let dataRoutes = adaptElements(
    context.routerState.routes,
    context.routeModules
  );

  return (
    <DataStaticRouter
      dataRoutes={dataRoutes}
      context={staticContext}
      hydrate={false}
    >
      <RemixEntry context={context} />
    </DataStaticRouter>
  );
}
