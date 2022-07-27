import type { ComponentType, ReactNode } from "react";
import type { ActionFunction, LoaderFunction, Params } from "react-router";
import { ErrorResponse } from "@remix-run/router";

import type { RouteModules, ShouldReloadFunction } from "./routeModules";
import { loadRouteModule } from "./routeModules";
import {
  extractData,
  fetchData,
  isCatchResponse,
  isRedirectResponse,
} from "./data";
import type { Submission } from "./transition";
import { TransitionRedirect } from "./transition";
import { prefetchStyleLinks } from "./links";
import type { AssetsManifest } from "./entry";

export interface RouteManifest<Route> {
  [routeId: string]: Route;
}

// NOTE: make sure to change the Route in server-runtime if you change this
interface Route {
  caseSensitive?: boolean;
  id: string;
  path?: string;
  index?: boolean;
}

// NOTE: make sure to change the EntryRoute in server-runtime if you change this
export interface EntryRoute extends Route {
  hasAction: boolean;
  hasLoader: boolean;
  hasCatchBoundary: boolean;
  hasErrorBoundary: boolean;
  imports?: string[];
  module: string;
  parentId?: string;
}

export type RouteDataFunction = {
  (args: {
    /**
     * Parsed params from the route path
     */
    params: Params;

    /**
     * The url to be loaded, resolved to the matched route.
     */
    url: URL; // resolved route

    /**
     * Will be present if being called from `<Form>` or `useSubmit`
     */
    submission?: Submission;

    /**
     * Attach this signal to fetch (or whatever else) to abort your
     * implementation when a load/action is aborted.
     */
    signal: AbortSignal;
  }): Promise<any> | any;
};

export type RemixRouteComponentType = ComponentType<{ id: string }>;

async function loadRouteModuleWithBlockingLinks(
  route: EntryRoute,
  manifest: AssetsManifest,
  routeModules: RouteModules
) {
  let routeModule = await loadRouteModule(route, manifest, routeModules);
  await prefetchStyleLinks(routeModule);
  return routeModule;
}

export function createLoader(
  route: EntryRoute,
  manifest: AssetsManifest,
  routeModules: RouteModules
) {
  let loader: LoaderFunction = async ({ request }) => {
    if (route.hasLoader) {
      let [result] = await Promise.all([
        fetchData(request, route.id, false),
        loadRouteModuleWithBlockingLinks(route, manifest, routeModules),
      ]);

      if (result instanceof Error) throw result;

      let redirect = await checkRedirect(result);
      if (redirect) return redirect;

      if (isCatchResponse(result)) {
        throw new ErrorResponse(
          result.status,
          result.statusText,
          await extractData(result)
        );
      }

      return result;
    } else {
      await loadRouteModuleWithBlockingLinks(route, manifest, routeModules);
    }
  };

  return loader;
}

export function createAction(
  route: EntryRoute,
  manifest: AssetsManifest,
  routeModules: RouteModules
) {
  let action: ActionFunction = async ({ request }) => {
    if (!route.hasAction) {
      console.error(
        `Route "${route.id}" does not have an action, but you are trying ` +
          `to submit to it. To fix this, please add an \`action\` function to the route`
      );
    }

    let result = await fetchData(request, route.id, true);

    if (result instanceof Error) {
      throw result;
    }

    let redirect = await checkRedirect(result);
    if (redirect) return redirect;

    await loadRouteModuleWithBlockingLinks(route, manifest, routeModules);

    if (isCatchResponse(result)) {
      throw new ErrorResponse(
        result.status,
        result.statusText,
        await extractData(result)
      );
    }

    return result;
  };

  return action;
}

async function checkRedirect(
  response: Response
): Promise<null | TransitionRedirect> {
  if (isRedirectResponse(response)) {
    let url = new URL(
      response.headers.get("X-Remix-Redirect")!,
      window.location.origin
    );

    if (url.origin !== window.location.origin) {
      await new Promise(() => {
        window.location.replace(url.href);
      });
    } else {
      return new TransitionRedirect(
        url.pathname + url.search + url.hash,
        response.headers.get("X-Remix-Revalidate") !== null
      );
    }
  }

  return null;
}
