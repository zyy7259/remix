import type { DataRouteObject, StaticHandler } from "@remix-run/router";
import { isRouteErrorResponse } from "@remix-run/router";
import { createStaticHandler } from "@remix-run/router";

import type { AppLoadContext } from "./data";
import type { AppState } from "./errors";
import type { HandleDataRequestFunction, ServerBuild } from "./build";
import type { EntryContext } from "./entry";
import { createEntryMatches, createEntryRouteModules } from "./entry";
import { serializeError } from "./errors";
import { getDocumentHeaders } from "./headers";
import { ServerMode, isServerMode } from "./mode";
import type { RouteMatch } from "./routeMatching";
import { matchServerRoutes } from "./routeMatching";
import type { ServerRoute } from "./routes";
import {
  convertRouterMatchesToServerMatches,
  createServerDataRoutes,
} from "./rrr";
import { createRoutes } from "./routes";
import { json, isRedirectResponse } from "./responses";
import { createServerHandoffString } from "./serverHandoff";

export type RequestHandler = (
  request: Request,
  loadContext?: AppLoadContext
) => Promise<Response>;

export type CreateRequestHandlerFunction = (
  build: ServerBuild,
  mode?: string
) => RequestHandler;

export const createRequestHandler: CreateRequestHandlerFunction = (
  build,
  mode
) => {
  let routes = createRoutes(build.routes);
  let serverMode = isServerMode(mode) ? mode : ServerMode.Production;

  return async function requestHandler(request, loadContext) {
    let url = new URL(request.url);
    let matches = matchServerRoutes(routes, url.pathname);

    let { dataRoutes, query, queryRoute } = createStaticHandler({
      routes: createServerDataRoutes(build.routes, loadContext),
    });

    let response: Response;
    if (url.searchParams.has("_data")) {
      response = await handleDataRequest({
        request,
        loadContext,
        handleDataRequest: build.entry.module.handleDataRequest,
        serverMode,
        queryRoute,
      });
    } else if (matches && !matches[matches.length - 1].route.module.default) {
      response = await handleResourceRequest({
        request,
        serverMode,
        queryRoute,
      });
    } else {
      response = await handleDocumentRequest({
        build,
        request,
        serverMode,
        query,
        dataRoutes,
      });
    }

    if (request.method === "HEAD") {
      return new Response(null, {
        headers: response.headers,
        status: response.status,
        statusText: response.statusText,
      });
    }

    return response;
  };
};

async function handleDataRequest({
  handleDataRequest,
  loadContext,
  request,
  serverMode,
  queryRoute,
}: {
  handleDataRequest?: HandleDataRequestFunction;
  loadContext: unknown;
  request: Request;
  serverMode: ServerMode;
  queryRoute: StaticHandler["queryRoute"];
}): Promise<Response> {
  let url = new URL(request.url);
  let routeId = url.searchParams.get("_data");

  if (!routeId) {
    return errorBoundaryError(new Error(`Missing route id in ?_data`), 403);
  }

  // TODO: Handle this in the router?
  // TODO: Add HEAD request support to the router
  if (!isValidRequestMethod(request)) {
    return errorBoundaryError(
      new Error(`Invalid request method "${request.method}"`),
      405
    );
  }

  try {
    let state = await queryRoute(request, routeId);

    if (state instanceof Error) {
      return errorBoundaryError(state, 500);
    }

    if (isRouteErrorResponse(state)) {
      return errorBoundaryError(new Error(state.data), state.status);
    }

    if (state instanceof Response) {
      let response = state;
      if (isRedirectResponse(response)) {
        // We don't have any way to prevent a fetch request from following
        // redirects. So we use the `X-Remix-Redirect` header to indicate the
        // next URL, and then "follow" the redirect manually on the client.
        let headers = new Headers(response.headers);
        headers.set("X-Remix-Redirect", headers.get("Location")!);
        headers.delete("Location");
        if (response.headers.get("Set-Cookie") !== null) {
          headers.set("X-Remix-Revalidate", "yes");
        }

        return new Response(null, {
          status: 204,
          headers,
        });
      }

      if (handleDataRequest) {
        response = await handleDataRequest(response, {
          context: loadContext,
          // TODO: How to get the matched params?
          // Call getRequestMatch() or change router return API to { state, params }
          params: {},
          request,
        });
      }

      return response;
    }

    // TODO: Should never get here since callRouteLoader/callRouteAction should
    // enforce a response?
    throw new Error("Unhandled queryRoute return value");
  } catch (error: unknown) {
    if (serverMode !== ServerMode.Test) {
      console.error(error);
    }

    if (serverMode === ServerMode.Development) {
      return errorBoundaryError(error as Error, 500);
    }

    return errorBoundaryError(new Error("Unexpected Server Error"), 500);
  }
}

async function handleDocumentRequest({
  build,
  request,
  serverMode,
  query,
  dataRoutes,
}: {
  build: ServerBuild;
  request: Request;
  serverMode?: ServerMode;
  query: StaticHandler["query"];
  dataRoutes: DataRouteObject[];
}): Promise<Response> {
  let context = await query(request);
  if (context instanceof Response) {
    return context;
  }

  let appState: AppState = {
    trackBoundaries: true,
    trackCatchBoundaries: true,
    catchBoundaryRouteId: null,
    renderBoundaryRouteId: null,
    loaderBoundaryRouteId: null,
    error: undefined,
    catch: undefined,
  };

  if (context.errors) {
    // TODO: Differentiate catch versus error here
    let [routeId, error] = Object.entries(context.errors)[0];
    appState.trackCatchBoundaries = false;
    appState.catchBoundaryRouteId = routeId;
    appState.catch = error;
  }

  // TODO: Handle this.  Can we just expose a status code on the static router
  // state?  Or do not extract response data at all and return raw Responses on
  // actionData/loaderData
  let notOkResponse = null;
  let responseStatusCode = appState.error
    ? 500
    : typeof notOkResponse === "number"
    ? notOkResponse
    : appState.catch
    ? appState.catch.status
    : 200;

  let matches = convertRouterMatchesToServerMatches(
    context.matches,
    build.routes
  );
  let renderableMatches = getRenderableMatches(matches, appState) || [];

  // TODO: handle results here.  For static handlers do we want to not unwrap
  // any responses up front?  We can process them as needed and then unwrap
  // after this?
  let responseHeaders = getDocumentHeaders(
    build,
    renderableMatches,
    {},
    undefined
  );

  let serverHandoff = {
    actionData: context.actionData || undefined,
    appState: appState,
    matches: createEntryMatches(renderableMatches, build.assets.routes),
    routeData: context.loaderData,
    dataErrors: context.errors || undefined,
  };

  let entryContext: EntryContext = {
    ...serverHandoff,
    manifest: build.assets,
    routeModules: createEntryRouteModules(build.routes),
    serverHandoffString: createServerHandoffString(serverHandoff),
    dataRoutes,
    dataLocation: context.location,
    dataMatches: context.matches,
  };

  let handleDocumentRequest = build.entry.module.default;
  try {
    return await handleDocumentRequest(
      request,
      responseStatusCode,
      responseHeaders,
      entryContext
    );
  } catch (error: any) {
    console.log("caught error in entry.server handleDocumentRequest", error);
    responseStatusCode = 500;

    // Go again, this time with the componentDidCatch emulation. As it rendered
    // last time we mutated `componentDidCatch.routeId` for the last rendered
    // route, now we know where to render the error boundary (feels a little
    // hacky but that's how hooks work). This tells the emulator to stop
    // tracking the `routeId` as we render because we already have an error to
    // render.
    appState.trackBoundaries = false;
    appState.error = await serializeError(error);
    entryContext.dataErrors = {
      [appState.renderBoundaryRouteId]: appState.error,
    };
    serverHandoff.dataErrors = {
      [appState.renderBoundaryRouteId]: appState.error,
    };
    entryContext.serverHandoffString = createServerHandoffString(serverHandoff);

    try {
      return await handleDocumentRequest(
        request,
        responseStatusCode,
        responseHeaders,
        entryContext
      );
    } catch (error: any) {
      if (serverMode !== ServerMode.Test) {
        console.error(error);
      }

      let message = "Unexpected Server Error";

      if (serverMode === ServerMode.Development) {
        message += `\n\n${String(error)}`;
      }

      // Good grief folks, get your act together 😂!
      return new Response(message, {
        status: 500,
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }
  }
}

async function handleResourceRequest({
  request,
  serverMode,
  queryRoute,
}: {
  request: Request;
  serverMode: ServerMode;
  queryRoute: StaticHandler["queryRoute"];
}): Promise<Response> {
  try {
    // TODO: Not specifying a routeId will internally choose the leaf/target
    // match.  Clean this API up
    let state = await queryRoute(request);
    if (state instanceof Response) {
      return state;
    }
    // TODO: Is this a possible flow?
    throw state;
  } catch (error: any) {
    if (serverMode !== ServerMode.Test) {
      console.error(error);
    }

    let message = "Unexpected Server Error";

    if (serverMode === ServerMode.Development) {
      message += `\n\n${String(error)}`;
    }

    // Good grief folks, get your act together 😂!
    return new Response(message, {
      status: 500,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }
}

const validActionMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const validRequestMethods = new Set(["GET", "HEAD", ...validActionMethods]);

function isValidRequestMethod({ method }: Request): boolean {
  return validRequestMethods.has(method.toUpperCase());
}

async function errorBoundaryError(error: Error, status: number) {
  return json(await serializeError(error), {
    status,
    headers: {
      "X-Remix-Error": "yes",
    },
  });
}

// This prevents `<Outlet/>` from rendering anything below where the error threw
// TODO: maybe do this in <RemixErrorBoundary + context>
function getRenderableMatches(
  matches: RouteMatch<ServerRoute>[] | null,
  appState: AppState
) {
  if (!matches) {
    return null;
  }

  // no error, no worries
  if (!appState.catch && !appState.error) {
    return matches;
  }

  let lastRenderableIndex: number = -1;

  matches.forEach((match, index) => {
    let id = match.route.id;
    if (
      appState.renderBoundaryRouteId === id ||
      appState.loaderBoundaryRouteId === id ||
      appState.catchBoundaryRouteId === id
    ) {
      lastRenderableIndex = index;
    }
  });

  return matches.slice(0, lastRenderableIndex + 1);
}
