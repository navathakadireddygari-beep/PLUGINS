/**
 * Minimal JSON client for the GIS REST module.
 *
 * Every call carries the bearer token + role/user_email headers, retries once
 * with a freshly minted token on 401, and unwraps the `{ apiStatus, apiMessage,
 * data }` envelope — a non-"S" status is thrown as an Error with the server's
 * message, since the gateway answers 200 for business failures too.
 */

import { getAccessToken } from "@/api/auth-api";
import { authHeaders, getAppConfig } from "@/config/app-config";

type Method = "GET" | "POST" | "PUT";

export async function requestJson<T = unknown>(
  method: Method,
  path: string,
  options: {
    params?: Record<string, string | number>;
    /** Extra request headers, e.g. the Buy Plan GET's `proposal_id`. */
    headers?: Record<string, string | number>;
    body?: unknown;
    signal?: AbortSignal;
  } = {}
): Promise<T> {
  const { api_endpoint } = getAppConfig();
  if (!api_endpoint) throw new Error("Missing api_endpoint in window.__APP_CONFIG__.");

  const query = options.params
    ? `?${new URLSearchParams(
        Object.entries(options.params).map(([k, v]) => [k, String(v)])
      ).toString()}`
    : "";
  const url = `${api_endpoint}${path}${query}`;

  const send = async (token: string) =>
    fetch(url, {
      method,
      signal: options.signal,
      headers: {
        Accept: "application/json",
        ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...authHeaders(token),
        ...Object.fromEntries(Object.entries(options.headers ?? {}).map(([k, v]) => [k, String(v)])),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

  let res = await send(await getAccessToken());
  // A rejected token gets one retry against a freshly minted one.
  if (res.status === 401) res = await send(await getAccessToken(true));

  // Read as text first: an ORDS 500 is often an HTML/plain-text error page,
  // and that page is the only clue to what the server rejected.
  const text = await res.text();
  let raw: Record<string, unknown> = {};
  try {
    raw = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    /* non-JSON body — kept in `text` */
  }
  const apiStatus = (raw.apiStatus ?? raw.api_status) as string | undefined;
  const apiMessage = raw.apiMessage as string | undefined;

  if (!res.ok) {
    console.error(`[http] ${method} ${path} -> ${res.status}`, text);
    throw new Error(`${method} failed (${res.status}): ${apiMessage || text.slice(0, 200) || res.statusText}`);
  }
  if (apiStatus && apiStatus !== "S" && apiStatus !== "SUCCESS") {
    throw new Error(apiMessage || `${method} ${path} failed.`);
  }
  return raw.data as T;
}
