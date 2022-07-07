import type { Location } from "react-router-dom";

export interface Submission {
  action: string;
  method: string;
  formData: FormData;
  encType: string;
  key: string;
}

export interface ActionSubmission extends Submission {
  method: "POST" | "PUT" | "PATCH" | "DELETE";
}

export interface LoaderSubmission extends Submission {
  method: "GET";
}

export type TransitionStates = {
  Idle: {
    state: "idle";
    type: "idle";
    submission: undefined;
    location: undefined;
  };
  SubmittingAction: {
    state: "submitting";
    type: "actionSubmission";
    submission: ActionSubmission;
    location: Location;
  };
  SubmittingLoader: {
    state: "submitting";
    type: "loaderSubmission";
    submission: LoaderSubmission;
    location: Location;
  };
  LoadingLoaderSubmissionRedirect: {
    state: "loading";
    type: "loaderSubmissionRedirect";
    submission: LoaderSubmission;
    location: Location;
  };
  LoadingAction: {
    state: "loading";
    type: "actionReload";
    submission: ActionSubmission;
    location: Location;
  };
  LoadingActionRedirect: {
    state: "loading";
    type: "actionRedirect";
    submission: ActionSubmission;
    location: Location;
  };
  LoadingFetchActionRedirect: {
    state: "loading";
    type: "fetchActionRedirect";
    submission: undefined;
    location: Location;
  };
  LoadingRedirect: {
    state: "loading";
    type: "normalRedirect";
    submission: undefined;
    location: Location;
  };
  Loading: {
    state: "loading";
    type: "normalLoad";
    location: Location;
    submission: undefined;
  };
};

export type Transition = TransitionStates[keyof TransitionStates];

type FetcherStates<TData = any> = {
  Idle: {
    state: "idle";
    type: "init";
    submission: undefined;
    data: undefined;
  };
  SubmittingAction: {
    state: "submitting";
    type: "actionSubmission";
    submission: ActionSubmission;
    data: undefined;
  };
  SubmittingLoader: {
    state: "submitting";
    type: "loaderSubmission";
    submission: LoaderSubmission;
    data: TData | undefined;
  };
  ReloadingAction: {
    state: "loading";
    type: "actionReload";
    submission: ActionSubmission;
    data: TData;
  };
  LoadingActionRedirect: {
    state: "loading";
    type: "actionRedirect";
    submission: ActionSubmission;
    data: undefined;
  };
  Loading: {
    state: "loading";
    type: "normalLoad";
    submission: undefined;
    data: TData | undefined;
  };
  Done: {
    state: "idle";
    type: "done";
    submission: undefined;
    data: TData;
  };
};

export type Fetcher<TData = any> =
  FetcherStates<TData>[keyof FetcherStates<TData>];

export class CatchValue {
  constructor(
    public status: number,
    public statusText: string,
    public data: any
  ) {}
}

export class TransitionRedirect {
  location: string;
  constructor(location: Location | string, public setCookie: boolean) {
    this.location =
      typeof location === "string"
        ? location
        : location.pathname + location.search;
  }
}
