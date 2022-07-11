import type {
  FocusEventHandler,
  MouseEventHandler,
  TouchEventHandler,
} from "react";
import * as React from "react";
import type {
  DataRouteMatch,
  FormProps,
  LinkProps,
  Location,
  Navigation,
  NavLinkProps,
  Params,
  SubmitFunction,
} from "react-router-dom";
import {
  DataRouter,
  UNSAFE_DataRouterContext,
  useFetcher as useRouterFetcher,
  useFetchers as useRouterFetchers,
} from "react-router-dom";
import {
  Link as RouterLink,
  NavLink as RouterNavLink,
  useLocation,
  useNavigation,
  useHref,
} from "react-router-dom";

import type { AppData } from "./data";
import type { EntryContext, AssetsManifest } from "./entry";
import type { AppState, SerializedError, ThrownResponse } from "./errors";
import {
  RemixRootDefaultErrorBoundary,
  RemixErrorBoundary,
  RemixRootDefaultCatchBoundary,
  RemixCatchBoundary,
} from "./errorBoundaries";
import invariant from "./invariant";
import {
  getDataLinkHrefs,
  getLinksForMatches,
  getModuleLinkHrefs,
  getNewMatchesForLinks,
  getStylesheetPrefetchLinks,
  isPageLinkDescriptor,
} from "./links";
import type { HtmlLinkDescriptor, PrefetchPageDescriptor } from "./links";
import { createHtml } from "./markup";
import type { ClientRoute } from "./routes";
import { createClientRoute } from "./routes";
import { createClientRoutes } from "./routes";
import type { RouteData } from "./routeData";
import type { RouteMatch as BaseRouteMatch } from "./routeMatching";
import { matchClientRoutes } from "./routeMatching";
import type { RouteModules, HtmlMetaDescriptor } from "./routeModules";
import type {
  Transition,
  Fetcher,
  ActionSubmission,
  LoaderSubmission,
} from "./transition";

////////////////////////////////////////////////////////////////////////////////
// RemixEntry

interface RemixEntryContextType {
  manifest: AssetsManifest;
  matches: BaseRouteMatch<ClientRoute>[];
  routeData: { [routeId: string]: RouteData };
  actionData?: RouteData;
  pendingLocation?: Location;
  appState: AppState;
  routeModules: RouteModules;
  serverHandoffString?: string;
  clientRoutes: ClientRoute[];
}

export const RemixEntryContext = React.createContext<
  RemixEntryContextType | undefined
>(undefined);

// FIXME: Unexport this once RemixRouteError moves into this file
export function useRemixEntryContext(): RemixEntryContextType {
  let context = React.useContext(RemixEntryContext);
  invariant(context, "You must render this element inside a <Remix> element");
  return context;
}

export function RemixEntry({
  context: entryContext,
}: {
  context: EntryContext;
}) {
  let dataRouterContext = React.useContext(UNSAFE_DataRouterContext);
  invariant(
    dataRouterContext,
    "RemixEntry can only be rendered within a Data Router"
  );
  let { router } = dataRouterContext;
  let {
    manifest,
    routeData,
    actionData,
    routeModules,
    serverHandoffString,
    appState,
  } = entryContext;

  let clientRoutes = React.useMemo(
    () => createClientRoutes(manifest.routes, routeModules, RemixRoute),
    [manifest, routeModules]
  );

  let matches = React.useMemo(
    () =>
      router.state.matches.map((match: DataRouteMatch) => {
        let clientMatch: BaseRouteMatch<ClientRoute> = {
          ...match,
          route: createClientRoute(
            manifest.routes[match.route.id],
            routeModules,
            RemixRoute
          ),
        };
        return clientMatch;
      }),
    [router, manifest, routeModules]
  );

  // If we tried to render and failed, and the app threw before rendering any
  // routes, get the error and pass it to the ErrorBoundary to emulate
  // `componentDidCatch`
  let ssrErrorBeforeRoutesRendered: Error | undefined;
  let ssrCatchBeforeRoutesRendered: ThrownResponse | undefined;

  if (appState.unhandledBoundaryError) {
    if (appState.unhandledBoundaryError?.status) {
      ssrCatchBeforeRoutesRendered = appState.unhandledBoundaryError;
    } else {
      ssrErrorBeforeRoutesRendered = appState.unhandledBoundaryError;
    }
  }

  return (
    <RemixEntryContext.Provider
      value={{
        matches,
        manifest,
        appState,
        routeModules,
        serverHandoffString,
        clientRoutes,
        routeData,
        actionData,
      }}
    >
      <RemixErrorBoundary
        location={dataRouterContext.router.state.location}
        component={RemixRootDefaultErrorBoundary}
        error={ssrErrorBeforeRoutesRendered}
        handleCatch={true}
      >
        <RemixCatchBoundary
          component={RemixRootDefaultCatchBoundary}
          catch={ssrCatchBeforeRoutesRendered}
        >
          <DataRouter />
        </RemixCatchBoundary>
      </RemixErrorBoundary>
    </RemixEntryContext.Provider>
  );
}

function deserializeError(data: SerializedError): Error {
  let error = new Error(data.message);
  error.stack = data.stack;
  return error;
}

////////////////////////////////////////////////////////////////////////////////
// RemixRoute

interface RemixRouteContextType {
  data: AppData;
  id: string;
}

const RemixRouteContext = React.createContext<
  RemixRouteContextType | undefined
>(undefined);

function DefaultRouteComponent({ id }: { id: string }): React.ReactElement {
  throw new Error(
    `Route "${id}" has no component! Please go add a \`default\` export in the route module file.\n` +
      "If you were trying to navigate or submit to a resource route, use `<a>` instead of `<Link>` or `<Form reloadDocument>`."
  );
}

export function RemixRoute({ id }: { id: string }) {
  let { routeData, routeModules, appState } = useRemixEntryContext();

  // This checks prevent cryptic error messages such as: 'Cannot read properties of undefined (reading 'root')'
  invariant(
    routeData,
    "Cannot initialize 'routeData'. This normally occurs when you have server code in your client modules.\n" +
      "Check this link for more details:\nhttps://remix.run/pages/gotchas#server-code-in-client-bundles"
  );
  invariant(
    routeModules,
    "Cannot initialize 'routeModules'. This normally occurs when you have server code in your client modules.\n" +
      "Check this link for more details:\nhttps://remix.run/pages/gotchas#server-code-in-client-bundles"
  );

  let data = routeData[id];
  let { default: Component, CatchBoundary, ErrorBoundary } = routeModules[id];
  let element = Component ? <Component /> : <DefaultRouteComponent id={id} />;

  let context: RemixRouteContextType = { data, id };

  // TODO: Figure out if we still need these separate flags or if one would do?
  console.log("rendering route id", id);

  if (CatchBoundary) {
    appState.deepestCatchBoundaryId = id;
  }

  if (ErrorBoundary) {
    appState.deepestErrorBoundaryId = id;
  }

  // It's important for the route context to be above the error boundary so that
  // a call to `useLoaderData` doesn't accidentally get the parents route's data.
  return (
    <RemixRouteContext.Provider value={context}>
      {element}
    </RemixRouteContext.Provider>
  );
}

////////////////////////////////////////////////////////////////////////////////
// Public API

/**
 * Defines the prefetching behavior of the link:
 *
 * - "intent": Fetched when the user focuses or hovers the link
 * - "render": Fetched when the link is rendered
 * - "none": Never fetched
 */
type PrefetchBehavior = "intent" | "render" | "none";

export interface RemixLinkProps extends LinkProps {
  prefetch?: PrefetchBehavior;
}

export interface RemixNavLinkProps extends NavLinkProps {
  prefetch?: PrefetchBehavior;
}

interface PrefetchHandlers {
  onFocus?: FocusEventHandler<Element>;
  onBlur?: FocusEventHandler<Element>;
  onMouseEnter?: MouseEventHandler<Element>;
  onMouseLeave?: MouseEventHandler<Element>;
  onTouchStart?: TouchEventHandler<Element>;
}

function usePrefetchBehavior(
  prefetch: PrefetchBehavior,
  theirElementProps: PrefetchHandlers
): [boolean, PrefetchHandlers] {
  let [maybePrefetch, setMaybePrefetch] = React.useState(false);
  let [shouldPrefetch, setShouldPrefetch] = React.useState(false);
  let { onFocus, onBlur, onMouseEnter, onMouseLeave, onTouchStart } =
    theirElementProps;

  React.useEffect(() => {
    if (prefetch === "render") {
      setShouldPrefetch(true);
    }
  }, [prefetch]);

  let setIntent = () => {
    if (prefetch === "intent") {
      setMaybePrefetch(true);
    }
  };

  let cancelIntent = () => {
    if (prefetch === "intent") {
      setMaybePrefetch(false);
      setShouldPrefetch(false);
    }
  };

  React.useEffect(() => {
    if (maybePrefetch) {
      let id = setTimeout(() => {
        setShouldPrefetch(true);
      }, 100);
      return () => {
        clearTimeout(id);
      };
    }
  }, [maybePrefetch]);

  return [
    shouldPrefetch,
    {
      onFocus: composeEventHandlers(onFocus, setIntent),
      onBlur: composeEventHandlers(onBlur, cancelIntent),
      onMouseEnter: composeEventHandlers(onMouseEnter, setIntent),
      onMouseLeave: composeEventHandlers(onMouseLeave, cancelIntent),
      onTouchStart: composeEventHandlers(onTouchStart, setIntent),
    },
  ];
}

/**
 * A special kind of `<Link>` that knows whether or not it is "active".
 *
 * @see https://remix.run/api/remix#navlink
 */
let NavLink = React.forwardRef<HTMLAnchorElement, RemixNavLinkProps>(
  ({ to, prefetch = "none", ...props }, forwardedRef) => {
    let href = useHref(to);
    let [shouldPrefetch, prefetchHandlers] = usePrefetchBehavior(
      prefetch,
      props
    );
    return (
      <>
        <RouterNavLink
          ref={forwardedRef}
          to={to}
          {...props}
          {...prefetchHandlers}
        />
        {shouldPrefetch ? <PrefetchPageLinks page={href} /> : null}
      </>
    );
  }
);
NavLink.displayName = "NavLink";
export { NavLink };
/**
 * This component renders an anchor tag and is the primary way the user will
 * navigate around your website.
 *
 * @see https://remix.run/api/remix#link
 */
let Link = React.forwardRef<HTMLAnchorElement, RemixLinkProps>(
  ({ to, prefetch = "none", ...props }, forwardedRef) => {
    let href = useHref(to);
    let [shouldPrefetch, prefetchHandlers] = usePrefetchBehavior(
      prefetch,
      props
    );
    return (
      <>
        <RouterLink
          ref={forwardedRef}
          to={to}
          {...props}
          {...prefetchHandlers}
        />
        {shouldPrefetch ? <PrefetchPageLinks page={href} /> : null}
      </>
    );
  }
);
Link.displayName = "Link";
export { Link };

export function composeEventHandlers<
  EventType extends React.SyntheticEvent | Event
>(
  theirHandler: ((event: EventType) => any) | undefined,
  ourHandler: (event: EventType) => any
): (event: EventType) => any {
  return (event) => {
    theirHandler && theirHandler(event);
    if (!event.defaultPrevented) {
      ourHandler(event);
    }
  };
}

/**
 * Renders the `<link>` tags for the current routes.
 *
 * @see https://remix.run/api/remix#meta-links-scripts
 */
export function Links() {
  let { matches, routeModules, manifest } = useRemixEntryContext();

  let links = React.useMemo(
    () => getLinksForMatches(matches, routeModules, manifest),
    [matches, routeModules, manifest]
  );

  return (
    <>
      {links.map((link) => {
        if (isPageLinkDescriptor(link)) {
          return <PrefetchPageLinks key={link.page} {...link} />;
        }

        let imageSrcSet: string | null = null;

        // In React 17, <link imageSrcSet> and <link imageSizes> will warn
        // because the DOM attributes aren't recognized, so users need to pass
        // them in all lowercase to forward the attributes to the node without a
        // warning. Normalize so that either property can be used in Remix.
        if ("useId" in React) {
          if (link.imagesrcset) {
            link.imageSrcSet = imageSrcSet = link.imagesrcset;
            delete link.imagesrcset;
          }

          if (link.imagesizes) {
            link.imageSizes = link.imagesizes;
            delete link.imagesizes;
          }
        } else {
          if (link.imageSrcSet) {
            link.imagesrcset = imageSrcSet = link.imageSrcSet;
            delete link.imageSrcSet;
          }

          if (link.imageSizes) {
            link.imagesizes = link.imageSizes;
            delete link.imageSizes;
          }
        }

        return (
          <link
            key={link.rel + (link.href || "") + (imageSrcSet || "")}
            {...link}
          />
        );
      })}
    </>
  );
}

/**
 * This component renders all of the `<link rel="prefetch">` and
 * `<link rel="modulepreload"/>` tags for all the assets (data, modules, css) of
 * a given page.
 *
 * @param props
 * @param props.page
 * @see https://remix.run/api/remix#prefetchpagelinks-
 */
export function PrefetchPageLinks({
  page,
  ...dataLinkProps
}: PrefetchPageDescriptor) {
  let { clientRoutes } = useRemixEntryContext();
  let matches = React.useMemo(
    () => matchClientRoutes(clientRoutes, page),
    [clientRoutes, page]
  );

  if (!matches) {
    console.warn(`Tried to prefetch ${page} but no routes matched.`);
    return null;
  }

  return (
    <PrefetchPageLinksImpl page={page} matches={matches} {...dataLinkProps} />
  );
}

function usePrefetchedStylesheets(matches: BaseRouteMatch<ClientRoute>[]) {
  let { routeModules } = useRemixEntryContext();

  let [styleLinks, setStyleLinks] = React.useState<HtmlLinkDescriptor[]>([]);

  React.useEffect(() => {
    let interrupted: boolean = false;

    getStylesheetPrefetchLinks(matches, routeModules).then((links) => {
      if (!interrupted) setStyleLinks(links);
    });

    return () => {
      interrupted = true;
    };
  }, [matches, routeModules]);

  return styleLinks;
}

function PrefetchPageLinksImpl({
  page,
  matches: nextMatches,
  ...linkProps
}: PrefetchPageDescriptor & {
  matches: BaseRouteMatch<ClientRoute>[];
}) {
  let location = useLocation();
  let { matches, manifest } = useRemixEntryContext();

  let newMatchesForData = React.useMemo(
    () => getNewMatchesForLinks(page, nextMatches, matches, location, "data"),
    [page, nextMatches, matches, location]
  );

  let newMatchesForAssets = React.useMemo(
    () => getNewMatchesForLinks(page, nextMatches, matches, location, "assets"),
    [page, nextMatches, matches, location]
  );

  let dataHrefs = React.useMemo(
    () => getDataLinkHrefs(page, newMatchesForData, manifest),
    [newMatchesForData, page, manifest]
  );

  let moduleHrefs = React.useMemo(
    () => getModuleLinkHrefs(newMatchesForAssets, manifest),
    [newMatchesForAssets, manifest]
  );

  // needs to be a hook with async behavior because we need the modules, not
  // just the manifest like the other links in here.
  let styleLinks = usePrefetchedStylesheets(newMatchesForAssets);

  return (
    <>
      {dataHrefs.map((href) => (
        <link key={href} rel="prefetch" as="fetch" href={href} {...linkProps} />
      ))}
      {moduleHrefs.map((href) => (
        <link key={href} rel="modulepreload" href={href} {...linkProps} />
      ))}
      {styleLinks.map((link) => (
        // these don't spread `linkProps` because they are full link descriptors
        // already with their own props
        <link key={link.href} {...link} />
      ))}
    </>
  );
}

/**
 * Renders the `<title>` and `<meta>` tags for the current routes.
 *
 * @see https://remix.run/api/remix#meta-links-scripts
 */
export function Meta() {
  let { matches, routeData, routeModules } = useRemixEntryContext();
  let location = useLocation();

  let meta: HtmlMetaDescriptor = {};
  let parentsData: { [routeId: string]: AppData } = {};

  for (let match of matches) {
    let routeId = match.route.id;
    let data = routeData[routeId];
    let params = match.params;

    let routeModule = routeModules[routeId];

    if (routeModule.meta) {
      let routeMeta =
        typeof routeModule.meta === "function"
          ? routeModule.meta({ data, parentsData, params, location })
          : routeModule.meta;
      Object.assign(meta, routeMeta);
    }

    parentsData[routeId] = data;
  }

  return (
    <>
      {Object.entries(meta).map(([name, value]) => {
        if (!value) {
          return null;
        }

        if (["charset", "charSet"].includes(name)) {
          return <meta key="charset" charSet={value as string} />;
        }

        if (name === "title") {
          return <title key="title">{value}</title>;
        }

        // Open Graph tags use the `property` attribute, while other meta tags
        // use `name`. See https://ogp.me/
        let isOpenGraphTag = name.startsWith("og:");
        return [value].flat().map((content) => {
          if (isOpenGraphTag) {
            return (
              <meta
                content={content as string}
                key={name + content}
                property={name}
              />
            );
          }

          if (typeof content === "string") {
            return <meta content={content} name={name} key={name + content} />;
          }

          return <meta key={name + JSON.stringify(content)} {...content} />;
        });
      })}
    </>
  );
}

/**
 * Tracks whether Remix has finished hydrating or not, so scripts can be skipped
 * during client-side updates.
 */
let isHydrated = false;

type ScriptProps = Omit<
  React.HTMLProps<HTMLScriptElement>,
  | "children"
  | "async"
  | "defer"
  | "src"
  | "type"
  | "noModule"
  | "dangerouslySetInnerHTML"
  | "suppressHydrationWarning"
>;

/**
 * Renders the `<script>` tags needed for the initial render. Bundles for
 * additional routes are loaded later as needed.
 *
 * @param props Additional properties to add to each script tag that is rendered.
 * In addition to scripts, \<link rel="modulepreload"> tags receive the crossOrigin
 * property if provided.
 *
 * @see https://remix.run/api/remix#meta-links-scripts
 */
export function Scripts(props: ScriptProps) {
  let {
    manifest,
    matches,
    pendingLocation,
    clientRoutes,
    serverHandoffString,
  } = useRemixEntryContext();

  React.useEffect(() => {
    isHydrated = true;
  }, []);

  let initialScripts = React.useMemo(() => {
    let contextScript = serverHandoffString
      ? `window.__remixContext = ${serverHandoffString};`
      : "";

    let routeModulesScript = `${matches
      .map(
        (match, index) =>
          `import * as route${index} from ${JSON.stringify(
            manifest.routes[match.route.id].module
          )};`
      )
      .join("\n")}
window.__remixRouteModules = {${matches
      .map((match, index) => `${JSON.stringify(match.route.id)}:route${index}`)
      .join(",")}};`;

    return (
      <>
        <script
          {...props}
          suppressHydrationWarning
          dangerouslySetInnerHTML={createHtml(contextScript)}
        />
        <script {...props} src={manifest.url} />
        <script
          {...props}
          dangerouslySetInnerHTML={createHtml(routeModulesScript)}
          type="module"
        />
        <script {...props} src={manifest.entry.module} type="module" />
      </>
    );
    // disabled deps array because we are purposefully only rendering this once
    // for hydration, after that we want to just continue rendering the initial
    // scripts as they were when the page first loaded
    // eslint-disable-next-line
  }, []);

  // avoid waterfall when importing the next route module
  let nextMatches = React.useMemo(() => {
    if (pendingLocation) {
      // TODO: Can this leverage useNavigation.location?
      // FIXME: can probably use transitionManager `nextMatches`
      let matches = matchClientRoutes(clientRoutes, pendingLocation);
      invariant(matches, `No routes match path "${pendingLocation.pathname}"`);
      return matches;
    }

    return [];
  }, [pendingLocation, clientRoutes]);

  let routePreloads = matches
    .concat(nextMatches)
    .map((match) => {
      let route = manifest.routes[match.route.id];
      return (route.imports || []).concat([route.module]);
    })
    .flat(1);

  let preloads = manifest.entry.imports.concat(routePreloads);

  return (
    <>
      {dedupe(preloads).map((path) => (
        <link
          key={path}
          rel="modulepreload"
          href={path}
          crossOrigin={props.crossOrigin}
        />
      ))}
      {isHydrated ? null : initialScripts}
    </>
  );
}

function dedupe(array: any[]) {
  return [...new Set(array)];
}

/**
 * Setup a callback to be fired on the window's `beforeunload` event. This is
 * useful for saving some data to `window.localStorage` just before the page
 * refreshes, which automatically happens on the next `<Link>` click when Remix
 * detects a new version of the app is available on the server.
 *
 * Note: The `callback` argument should be a function created with
 * `React.useCallback()`.
 *
 * @see https://remix.run/api/remix#usebeforeunload
 */
export function useBeforeUnload(callback: () => any): void {
  React.useEffect(() => {
    window.addEventListener("beforeunload", callback);
    return () => {
      window.removeEventListener("beforeunload", callback);
    };
  }, [callback]);
}

export interface RouteMatch {
  /**
   * The id of the matched route
   */
  id: string;
  /**
   * The pathname of the matched route
   */
  pathname: string;
  /**
   * The dynamic parameters of the matched route
   *
   * @see https://remix.run/docs/api/conventions#dynamic-route-parameters
   */
  params: Params<string>;
  /**
   * Any route data associated with the matched route
   */
  data: RouteData;
  /**
   * The exported `handle` object of the matched route.
   *
   * @see https://remix.run/docs/api/conventions#handle
   */
  handle: undefined | { [key: string]: any };
}

export type FetcherWithComponents<TData> = Fetcher<TData> & {
  Form: React.ForwardRefExoticComponent<
    FormProps & React.RefAttributes<HTMLFormElement>
  >;
  submit: SubmitFunction;
  load: (href: string) => void;
};

type FlattenedSubmission = Pick<
  Navigation,
  "formData" | "formMethod" | "formAction" | "formEncType"
>;

function getSubmission(
  flattenedSubmission: FlattenedSubmission
): ActionSubmission | LoaderSubmission | undefined {
  let { formData, formMethod, formAction, formEncType } = flattenedSubmission;

  if (!formData || !formMethod || !formAction || !formEncType) {
    return undefined;
  }

  // TODO: Convert router to use uppercase
  let method = formMethod.toUpperCase();
  if (method === "GET") {
    // TODO: We removed loader "submissions" in router - what to do here?
    let submission: LoaderSubmission = {
      formData: formData,
      method,
      action: formAction,
      encType: formEncType,
      // TODO: Can we backfill this?
      key: "",
    };
    return submission;
  } else {
    let submission: ActionSubmission = {
      formData: formData,
      method: method as "POST" | "PUT" | "PATCH" | "DELETE",
      action: formAction,
      encType: formEncType,
      // TODO: Can we backfill this?
      key: "",
    };
    return submission;
  }
}

/**
 * Interacts with route loaders and actions without causing a navigation. Great
 * for any interaction that stays on the same page.
 *
 * @see https://remix.run/api/remix#usefetcher
 */
export function useFetcher<TData = any>(): FetcherWithComponents<TData> {
  let routerFetcher = useRouterFetcher<TData>();
  let remixFetcher: FetcherWithComponents<TData> = {
    Form: routerFetcher.Form,
    load: routerFetcher.load,
    submit: routerFetcher.submit,
    state: routerFetcher.state,
    // TODO: Backfill fetcher type
    type: null,
    data: routerFetcher.data,
    submission: getSubmission(routerFetcher),
  };
  return remixFetcher;
}

/**
 * Provides all fetchers currently on the page. Useful for layouts and parent
 * routes that need to provide pending/optimistic UI regarding the fetch.
 *
 * @see https://remix.run/api/remix#usefetchers
 */
export function useFetchers(): Fetcher[] {
  let routerFetchers = useRouterFetchers();
  return routerFetchers.map((routerFetcher) => {
    let remixFetcher: Fetcher = {
      state: routerFetcher.state,
      // TODO: Backfill fetcher type
      type: null,
      data: routerFetcher.data,
      submission: getSubmission(routerFetcher),
    };
    return remixFetcher;
  });
}

/**
 * Returns everything you need to know about a page transition to build pending
 * navigation indicators and optimistic UI on data mutations.
 *
 * @see https://remix.run/api/remix#usetransition
 */
export function useTransition(): Transition {
  let navigation = useNavigation();
  let transition: Transition = {
    ...navigation,
    // TODO: Backfill type
    type: null,
    submission: getSubmission(navigation),
  };
  return transition;
}

// Dead Code Elimination magic for production builds.
// This way devs don't have to worry about doing the NODE_ENV check themselves.
// If running an un-bundled server outside of `remix dev` you will still need
// to set the REMIX_DEV_SERVER_WS_PORT manually.
export const LiveReload =
  process.env.NODE_ENV !== "development"
    ? () => null
    : function LiveReload({
        port = Number(process.env.REMIX_DEV_SERVER_WS_PORT || 8002),
        nonce = undefined,
      }: {
        port?: number;
        /**
         * @deprecated this property is no longer relevant.
         */
        nonce?: string;
      }) {
        let js = String.raw;
        return (
          <script
            nonce={nonce}
            suppressHydrationWarning
            dangerouslySetInnerHTML={{
              __html: js`
                (() => {
                  let protocol = location.protocol === "https:" ? "wss:" : "ws:";
                  let host = location.hostname;
                  let socketPath = protocol + "//" + host + ":" + ${String(
                    port
                  )} + "/socket";

                  let ws = new WebSocket(socketPath);
                  ws.onmessage = (message) => {
                    let event = JSON.parse(message.data);
                    if (event.type === "LOG") {
                      console.log(event.message);
                    }
                    if (event.type === "RELOAD") {
                      console.log("💿 Reloading window ...");
                      window.location.reload();
                    }
                  };
                  ws.onerror = (error) => {
                    console.log("Remix dev asset server web socket error:");
                    console.error(error);
                  };
                })();
              `,
            }}
          />
        );
      };
