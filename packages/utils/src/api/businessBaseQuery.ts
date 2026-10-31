import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import { sessionExpired } from "../auth/authSlice";
import { clearToken, getToken } from "../auth/session";
import { decryptPayload, encryptPayload } from "./payloadCrypto";

export type BusinessRequest = FetchArgs & {
  encryptRequest?: boolean;
  decryptResponse?: boolean;
};

let unauthorizedHandled = false;

export function resetUnauthorizedHandling(): void {
  unauthorizedHandled = false;
}

function handleUnauthorized(dispatch: (action: ReturnType<typeof sessionExpired>) => void): void {
  if (unauthorizedHandled) return;
  unauthorizedHandled = true;
  clearToken();
  dispatch(sessionExpired());
}

function customError(error: string): { error: FetchBaseQueryError } {
  return { error: { status: "CUSTOM_ERROR", error } };
}

function withPlainTextContent(headers: FetchArgs["headers"]): FetchArgs["headers"] {
  if (headers instanceof Headers) {
    const next = new Headers(headers);
    next.set("Content-Type", "text/plain");
    return next;
  }
  if (Array.isArray(headers)) {
    return [...headers, ["Content-Type", "text/plain"]];
  }
  return { ...headers, "Content-Type": "text/plain" };
}

function isExpired(error: FetchBaseQueryError): boolean {
  if (error.status === 401) return true;
  return error.status === "PARSING_ERROR" && error.originalStatus === 401;
}

export function createBusinessBaseQuery(baseUrl: string): BaseQueryFn<
  string | BusinessRequest,
  unknown,
  FetchBaseQueryError
> {
  const rawBaseQuery = fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers) => {
      const token = getToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      if (!headers.has("Accept")) headers.set("Accept", "application/json");
      return headers;
    },
  });

  return async (args, api, extraOptions) => {
    const request: BusinessRequest = typeof args === "string" ? { url: args } : { ...args };
    const method = (request.method ?? "GET").toUpperCase();
    const fetchArgs: FetchArgs = {
      url: request.url,
      method,
      params: request.params,
      headers: request.headers,
    };

    if (method !== "GET" && request.body !== undefined) {
      fetchArgs.body = request.body;
    }

    if (request.encryptRequest !== false && method !== "GET" && fetchArgs.body !== undefined) {
      try {
        fetchArgs.body = await encryptPayload(fetchArgs.body);
        fetchArgs.headers = withPlainTextContent(fetchArgs.headers);
      } catch {
        return customError("Unable to encrypt the request.");
      }
    }

    if (request.decryptResponse !== false) {
      fetchArgs.responseHandler = "text";
    }

    const result = await rawBaseQuery(fetchArgs, api, extraOptions);

    if (result.error) {
      if (isExpired(result.error)) handleUnauthorized(api.dispatch);
      return result;
    }

    if (request.decryptResponse === false || typeof result.data !== "string") {
      return result;
    }

    const payload = result.data.trim();
    if (payload.length === 0) return result;

    if (payload.startsWith("{") || payload.startsWith("[")) {
      try {
        return { data: JSON.parse(payload) as unknown };
      } catch {
        return customError("The response could not be read.");
      }
    }

    try {
      return { data: await decryptPayload(payload) };
    } catch {
      return customError("Unable to decrypt the response.");
    }
  };
}
