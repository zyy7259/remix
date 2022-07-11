import { isRouteErrorResponse } from "@remix-run/router";
import jsesc from "jsesc";

import { serializeCatch, serializeError } from "./errors";

export function createServerHandoffString(serverHandoff: any): string {
  let unhandledBoundaryError = serverHandoff.appState?.unhandledBoundaryError;
  if (unhandledBoundaryError) {
    serverHandoff.appState = {
      ...serverHandoff.appState,
      unhandledBoundaryError: unhandledBoundaryError
        ? isRouteErrorResponse(unhandledBoundaryError)
          ? serializeCatch(unhandledBoundaryError)
          : serializeError(unhandledBoundaryError)
        : null,
    };
  }
  if (serverHandoff.dataErrors) {
    let errors: Record<string, any> = {};
    for (let routeId of Object.keys(serverHandoff.dataErrors)) {
      let error = serverHandoff.dataErrors[routeId];
      errors[routeId] = isRouteErrorResponse(error)
        ? serializeCatch(error)
        : serializeError(error);
    }
    serverHandoff.dataErrors = errors;
  }

  // Use jsesc to escape data returned from the loaders. This string is
  // inserted directly into the HTML in the `<Scripts>` element.
  return jsesc(serverHandoff, { isScriptContext: true });
}
