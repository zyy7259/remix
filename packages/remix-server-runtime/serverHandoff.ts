import type { HydrationState, StaticHandlerContext } from "@remix-run/router";
import { isRouteErrorResponse } from "@remix-run/router";
import jsesc from "jsesc";

import type { SerializedError, ThrownResponse } from "./errors";
import { serializeCatch, serializeError } from "./errors";

interface SerializedHydrationState extends HydrationState {
  errors: Record<string, SerializedError | ThrownResponse> | null;
}

export function createServerHandoffString(
  context: StaticHandlerContext
): string {
  let { loaderData, actionData, errors } = context;
  let serverHandoff: SerializedHydrationState = {
    loaderData,
    actionData,
    errors: errors || getSerializedErrors(errors),
  };

  // Use jsesc to escape data returned from the loaders. This string is
  // inserted directly into the HTML in the `<Scripts>` element.
  return jsesc(serverHandoff, { isScriptContext: true });
}

function getSerializedError(error: Error | ThrownResponse | null) {
  if (!error) {
    return null;
  }

  if (isRouteErrorResponse(error)) {
    return serializeCatch(error);
  }

  return serializeError(error);
}

function getSerializedErrors(rawErrors: StaticHandlerContext["errors"]) {
  if (!rawErrors) {
    return null;
  }

  let errors: Record<string, any> = {};
  for (let routeId of Object.keys(rawErrors)) {
    errors[routeId] = getSerializedError(rawErrors[routeId]);
  }
  return errors;
}
