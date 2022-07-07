export type { RemixBrowserProps } from "./browser";
export { RemixBrowser } from "./browser";
export type {
  Location,
  NavigateFunction,
  Params,
  Fetcher,
  FormEncType,
  FormMethod,
  FormProps,
  SubmitOptions,
  SubmitFunction,
  Path,
} from "react-router-dom";
export {
  // TODO: Add reloadDocument to react-router-dom <Form>
  Form,
  Outlet,
  useActionData,
  useFormAction,
  useHref,
  useLoaderData,
  useLocation,
  useMatches,
  useNavigate,
  useNavigationType,
  useOutlet,
  useOutletContext,
  useParams,
  useResolvedPath,
  useSearchParams,
  useSubmit,
} from "react-router-dom";

export type {
  RouteMatch,
  RemixNavLinkProps as NavLinkProps,
  RemixLinkProps as LinkProps,
} from "./components";
export {
  Meta,
  Links,
  Scripts,
  Link,
  NavLink,
  PrefetchPageLinks,
  LiveReload,
  useFetcher,
  useFetchers,
  useTransition,
  useBeforeUnload,
} from "./components";

export type { ThrownResponse } from "./errors";
export { useCatch } from "./errorBoundaries";

export type { HtmlLinkDescriptor } from "./links";
export type { ShouldReloadFunction, HtmlMetaDescriptor } from "./routeModules";

// TODO: Update to wrap react-router-dom component
export { ScrollRestoration } from "./scroll-restoration";

export type { RemixServerProps } from "./server";
export { RemixServer } from "./server";
