import type { HydrationState } from "@remix-run/router";
import { isRouteErrorResponse } from "@remix-run/router";
import jsesc from "jsesc";

import type { AppState, SerializedError, ThrownResponse } from "./errors";
import { serializeCatch, serializeError } from "./errors";

interface SerializedAppState {
  deepestCatchBoundaryId: AppState["deepestCatchBoundaryId"];
  deepestErrorBoundaryId: AppState["deepestErrorBoundaryId"];
  unhandledBoundaryError: SerializedError | ThrownResponse | null;
}

interface SerializedHydrationState extends HydrationState {
  errors: Record<string, SerializedError | ThrownResponse> | null;
}

interface SerializedServerHandoffObject {
  appState?: SerializedAppState;
  hydrationData?: SerializedHydrationState;
}

export function createServerHandoffString(
  appState: AppState,
  hydrationData: HydrationState
): string {
  let serverHandoff: SerializedServerHandoffObject = {
    appState: {
      ...appState,
      unhandledBoundaryError: getSerializedError(
        appState.unhandledBoundaryError
      ),
    },
    hydrationData: {
      ...hydrationData,
      errors: getSerializedErrors(hydrationData),
    },
  };

  // Use jsesc to escape data returned from the loaders. This string is
  // inserted directly into the HTML in the `<Scripts>` element.
  return jsesc(serverHandoff, { isScriptContext: true });
}

function getSerializedError(error: AppState["unhandledBoundaryError"]) {
  if (!error) {
    return null;
  }

  if (isRouteErrorResponse(error)) {
    return serializeCatch(error);
  }

  return serializeError(error);
}

function getSerializedErrors(hydrationData: HydrationState) {
  if (!hydrationData.errors) {
    return null;
  }

  let errors: Record<string, any> = {};
  for (let routeId of Object.keys(hydrationData.errors)) {
    errors[routeId] = getSerializedError(hydrationData.errors[routeId]);
  }
  return errors;
}
