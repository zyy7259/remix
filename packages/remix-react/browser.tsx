import type { HydrationState } from "@remix-run/router";
import { ErrorResponse } from "@remix-run/router";
import type { ReactElement } from "react";
import * as React from "react";
import { DataBrowserRouter } from "react-router-dom";

import { RemixContext } from "./components";
import type { RemixContextObject } from "./entry";
import type { SerializedError } from "./errors";
import type { RouteModules } from "./routeModules";
import { createBrowserRouterDataRoutes } from "./rrr";

/* eslint-disable prefer-let/prefer-let */
declare global {
  var __remixHydrationData: HydrationState;
  var __remixRouteModules: RouteModules;
  var __remixManifest: RemixContextObject["manifest"];
}
/* eslint-enable prefer-let/prefer-let */

export interface RemixBrowserProps {}

/**
 * The entry point for a Remix app when it is rendered in the browser (in
 * `app/entry.client.js`). This component is used by React to hydrate the HTML
 * that was received from the server.
 */
export function RemixBrowser(_props: RemixBrowserProps): ReactElement {
  let hydrationData = window.__remixHydrationData;
  let manifest = window.__remixManifest;
  let routeModules = window.__remixRouteModules;

  // Deserialize errors and catch
  // TODO: Does this re-render?  Do we want to memo this?
  if (hydrationData.errors) {
    let errors: Record<string, any> = {};
    for (let routeId of Object.keys(hydrationData.errors)) {
      let error = hydrationData.errors[routeId];
      errors[routeId] =
        "status" in error ? deserializeCatch(error) : deserializeError(error);
    }
    hydrationData.errors = errors;
  }

  let routes = React.useMemo(
    () => createBrowserRouterDataRoutes(manifest.routes, routeModules),
    [manifest.routes, routeModules]
  );

  return (
    <RemixContext.Provider value={{ manifest, routeModules }}>
      <DataBrowserRouter routes={routes} hydrationData={hydrationData} />
    </RemixContext.Provider>
  );
}

// TODO: Duped from components.tsx
function deserializeError(data: SerializedError): Error {
  let error = new Error(data.message);
  error.stack = data.stack;
  return error;
}

function deserializeCatch(caught: any): ErrorResponse {
  let { status, statusText, data } = caught;
  return new ErrorResponse(status, statusText, data);
}
