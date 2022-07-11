import type { Router as DataRouter } from "@remix-run/router";
import { createBrowserRouter, ErrorResponse } from "@remix-run/router";
import type { ReactElement } from "react";
import * as React from "react";
import { WithDataRouter } from "react-router-dom";

import { RemixEntry, RemixRoute } from "./components";
import type { EntryContext } from "./entry";
import type { SerializedError, ThrownResponse } from "./errors";
import type { RouteModules } from "./routeModules";
import { createClientDataRoutes } from "./rrr";

/* eslint-disable prefer-let/prefer-let */
declare global {
  var __remixContext: EntryContext;
  var __remixRouteModules: RouteModules;
  var __remixManifest: EntryContext["manifest"];
}
/* eslint-enable prefer-let/prefer-let */

// Module-scoped singleton to hold the router.  Extracted from the React lifecycle
// to avoid issues w.r.t. dual initialization fetches in concurrent rendering.
// Data router apps are expected to have a static route tree and are not intended
// to be unmounted/remounted at runtime.
let routerSingleton: DataRouter;

export interface RemixBrowserProps {}

/**
 * The entry point for a Remix app when it is rendered in the browser (in
 * `app/entry.client.js`). This component is used by React to hydrate the HTML
 * that was received from the server.
 */
export function RemixBrowser(_props: RemixBrowserProps): ReactElement {
  let entryContext = window.__remixContext;
  entryContext.manifest = window.__remixManifest;
  entryContext.routeModules = window.__remixRouteModules;

  // Deserialize errors and catch
  if (entryContext.dataErrors) {
    let errors: Record<string, any> = {};
    for (let routeId of Object.keys(entryContext.dataErrors)) {
      let error = entryContext.dataErrors[routeId];
      errors[routeId] =
        "status" in error ? deserializeCatch(error) : deserializeError(error);
    }
    entryContext.dataErrors = errors;
  }

  if (!routerSingleton) {
    let routes = createClientDataRoutes(
      entryContext.manifest.routes,
      entryContext.routeModules
    );
    let hydrationData = {
      loaderData: entryContext.routeData,
      actionData: entryContext.actionData,
      errors: entryContext.dataErrors,
    };
    routerSingleton = createBrowserRouter({
      hydrationData,
      window,
      routes,
    }).initialize();
  }
  let router = routerSingleton;

  // TODO: Rename to DataRouterProvider since this isn't a HOC
  return (
    <WithDataRouter router={router}>
      <RemixEntry context={entryContext} />
    </WithDataRouter>
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
