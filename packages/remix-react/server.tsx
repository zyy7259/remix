import type { StaticHandlerContext } from "@remix-run/router";
import type { ReactElement } from "react";
import * as React from "react";
import { DataStaticRouter } from "react-router-dom/server";

import { RemixEntry } from "./components";
import type { EntryContext } from "./entry";

export interface RemixServerProps {
  context: EntryContext;
  url: string | URL;
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
    location: context.dataLocation,
    matches: context.dataMatches,
    loaderData: context.routeData,
    actionData: context.actionData || null,
    // TODO: do we need to send these through or will we handle this via remix
    // server-side error boundaries?
    errors: null,
  };

  return (
    <DataStaticRouter dataRoutes={context.dataRoutes} context={staticContext}>
      <RemixEntry context={context} />
    </DataStaticRouter>
  );
}
