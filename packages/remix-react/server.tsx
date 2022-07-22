import type { ReactElement } from "react";
import * as React from "react";
import { unstable_DataStaticRouter as DataStaticRouter } from "react-router-dom/server";

import { RemixContext } from "./components";
import type { EntryContext } from "./entry";
import { createStaticRouterDataRoutes } from "./rrr";

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

  let { manifest, routeModules, serverHandoffString } = context;
  let dataRoutes = createStaticRouterDataRoutes(manifest.routes, routeModules);

  return (
    <RemixContext.Provider
      value={{
        manifest,
        routeModules,
        serverHandoffString,
      }}
    >
      <DataStaticRouter
        routes={dataRoutes}
        context={context.staticHandlerContext}
        hydrate={false}
      />
    </RemixContext.Provider>
  );
}
