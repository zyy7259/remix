import type { StaticHandler } from "@remix-run/router";
import { createStaticHandler } from "@remix-run/router";

import type { AppLoadContext } from "./data";
import { callRouteAction, callRouteLoader } from "./data";
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
import { convertRouterMatchesToServerMatches } from "./routes";
import { createDataRoutes } from "./routes";
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

    let { query } = createStaticHandler({
      routes: createDataRoutes(build.routes, loadContext),
    });

    let response: Response;
    if (url.searchParams.has("_data")) {
      response = await handleDataRequest({
        request,
        loadContext,
        matches: matches!,
        handleDataRequest: build.entry.module.handleDataRequest,
        serverMode,
      });
    } else if (matches && !matches[matches.length - 1].route.module.default) {
      response = await handleResourceRequest({
        request,
        loadContext,
        matches,
        serverMode,
      });
    } else {
      response = await handleDocumentRequest({
        build,
        request,
        serverMode,
        query,
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
  matches,
  request,
  serverMode,
}: {
  handleDataRequest?: HandleDataRequestFunction;
  loadContext: unknown;
  matches: RouteMatch<ServerRoute>[];
  request: Request;
  serverMode: ServerMode;
}): Promise<Response> {
  if (!isValidRequestMethod(request)) {
    return errorBoundaryError(
      new Error(`Invalid request method "${request.method}"`),
      405
    );
  }

  let url = new URL(request.url);

  if (!matches) {
    return errorBoundaryError(
      new Error(`No route matches URL "${url.pathname}"`),
      404
    );
  }

  let response: Response;
  let match: RouteMatch<ServerRoute>;
  try {
    if (isActionRequest(request)) {
      match = getRequestMatch(url, matches);

      response = await callRouteAction({
        loadContext,
        match,
        request: request,
      });
    } else {
      let routeId = url.searchParams.get("_data");
      if (!routeId) {
        return errorBoundaryError(new Error(`Missing route id in ?_data`), 403);
      }

      let tempMatch = matches.find((match) => match.route.id === routeId);
      if (!tempMatch) {
        return errorBoundaryError(
          new Error(`Route "${routeId}" does not match URL "${url.pathname}"`),
          403
        );
      }
      match = tempMatch;

      response = await callRouteLoader({ loadContext, match, request });
    }

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
        params: match.params,
        request,
      });
    }

    return response;
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
}: {
  build: ServerBuild;
  request: Request;
  serverMode?: ServerMode;
  query: StaticHandler["query"];
}): Promise<Response> {
  let state = await query(request);
  if (state instanceof Response) {
    return state;
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

  if (state.errors) {
    // TODO: Differentiate catch versus error here
    let [routeId, error] = Object.entries(state.errors)[0];
    appState.trackCatchBoundaries = false;
    appState.catchBoundaryRouteId = routeId;
    appState.catch = error;
  }

  // TODO: Handle this.  Can we just expose a status code on the static router
  // state?
  let notOkResponse = null;
  let responseStatusCode = appState.error
    ? 500
    : typeof notOkResponse === "number"
    ? notOkResponse
    : appState.catch
    ? appState.catch.status
    : 200;

  let matches = convertRouterMatchesToServerMatches(
    state.matches,
    build.routes
  );
  let renderableMatches = getRenderableMatches(matches, appState) || [];

  // TODO: handle results here.  Tor static handlers do we want to not unwrap
  // any responses up front?  We can process them as needed and then unwrap
  // after this?
  let responseHeaders = getDocumentHeaders(
    build,
    renderableMatches,
    {},
    undefined
  );

  let serverHandoff = {
    actionData: state.actionData || undefined,
    appState: appState,
    matches: createEntryMatches(renderableMatches, build.assets.routes),
    routeData: state.loaderData,
  };

  let entryContext: EntryContext = {
    ...serverHandoff,
    manifest: build.assets,
    routeModules: createEntryRouteModules(build.routes),
    serverHandoffString: createServerHandoffString(serverHandoff),
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
    responseStatusCode = 500;

    // Go again, this time with the componentDidCatch emulation. As it rendered
    // last time we mutated `componentDidCatch.routeId` for the last rendered
    // route, now we know where to render the error boundary (feels a little
    // hacky but that's how hooks work). This tells the emulator to stop
    // tracking the `routeId` as we render because we already have an error to
    // render.
    appState.trackBoundaries = false;
    appState.error = await serializeError(error);
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
  loadContext,
  matches,
  request,
  serverMode,
}: {
  request: Request;
  loadContext: unknown;
  matches: RouteMatch<ServerRoute>[];
  serverMode: ServerMode;
}): Promise<Response> {
  let match = matches.slice(-1)[0];

  try {
    if (isActionRequest(request)) {
      return await callRouteAction({ match, loadContext, request });
    } else {
      return await callRouteLoader({ match, loadContext, request });
    }
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

function isActionRequest({ method }: Request): boolean {
  return validActionMethods.has(method.toUpperCase());
}

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

function isIndexRequestUrl(url: URL) {
  for (let param of url.searchParams.getAll("index")) {
    // only use bare `?index` params without a value
    // ✅ /foo?index
    // ✅ /foo?index&index=123
    // ✅ /foo?index=123&index
    // ❌ /foo?index=123
    if (param === "") {
      return true;
    }
  }

  return false;
}

function getRequestMatch(url: URL, matches: RouteMatch<ServerRoute>[]) {
  let match = matches.slice(-1)[0];

  if (!isIndexRequestUrl(url) && match.route.id.endsWith("/index")) {
    return matches.slice(-2)[0];
  }

  return match;
}

function getDeepestRouteIdWithBoundary(
  matches: RouteMatch<ServerRoute>[],
  key: "CatchBoundary" | "ErrorBoundary"
) {
  let matched = getMatchesUpToDeepestBoundary(matches, key).slice(-1)[0];
  return matched ? matched.route.id : null;
}

function getMatchesUpToDeepestBoundary(
  matches: RouteMatch<ServerRoute>[],
  key: "CatchBoundary" | "ErrorBoundary"
) {
  let deepestBoundaryIndex: number = -1;

  matches.forEach((match, index) => {
    if (match.route.module[key]) {
      deepestBoundaryIndex = index;
    }
  });

  if (deepestBoundaryIndex === -1) {
    // no route error boundaries, don't need to call any loaders
    return [];
  }

  return matches.slice(0, deepestBoundaryIndex + 1);
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
