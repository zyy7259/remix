import invariant from "./invariant";
import type { Submission } from "./transition";

export type AppData = any;

export function isCatchResponse(response: any): boolean {
  return (
    response instanceof Response &&
    response.headers.get("X-Remix-Catch") != null
  );
}

export function isErrorResponse(response: any): boolean {
  return (
    response instanceof Response &&
    response.headers.get("X-Remix-Error") != null
  );
}

export function isRedirectResponse(response: any): boolean {
  return (
    response instanceof Response &&
    response.headers.get("X-Remix-Redirect") != null
  );
}

export async function fetchData(
  request: Request,
  routeId: string,
  isAction = false
): Promise<Response | Error> {
  let url = new URL(request.url);
  url.searchParams.set("_data", routeId);

  // TODO: Clean this up - the incoming "request" is a POST action - but our
  // revalidating requests need to be GET's.  Should this be handled in the
  // router with a net new request?
  let init: RequestInit = {
    credentials: "same-origin",
    headers: request.headers,
    signal: request.signal,
    ...(isAction ? await getActionInit(request) : {}),
  };
  let response = await fetch(url, init);

  if (isErrorResponse(response)) {
    let data = await response.json();
    let error = new Error(data.message);
    error.stack = data.stack;
    return error;
  }

  return response;
}

export async function extractData(response: Response): Promise<AppData> {
  // This same algorithm is used on the server to interpret load
  // results when we render the HTML page.
  let contentType = response.headers.get("Content-Type");

  if (contentType && /\bapplication\/json\b/.test(contentType)) {
    return response.json();
  }

  return response.text();
}

async function getActionInit(request: Request): Promise<RequestInit> {
  let formData = await request.clone().formData();
  let body = formData;

  if (
    request.headers
      .get("Content-Type")
      ?.startsWith("application/x-www-form-urlencoded")
  ) {
    body = new URLSearchParams();
    for (let [key, value] of formData) {
      invariant(
        typeof value === "string",
        `File inputs are not supported with encType "application/x-www-form-urlencoded", please use "multipart/form-data" instead.`
      );
      body.append(key, value);
    }
  }

  return { method: request.method, body };
}
