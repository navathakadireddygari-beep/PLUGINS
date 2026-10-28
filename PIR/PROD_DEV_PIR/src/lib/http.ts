/**
 * Shared JSON fetch with a timeout that fails with a clear message.
 *
 * The previous per-endpoint code aborted with `controller.abort()` (no reason),
 * which surfaces as the cryptic DOMException "signal is aborted without reason".
 * Here we abort with an explicit reason and translate it into a readable error,
 * and use a longer default timeout since the ORDS endpoints can be slow to wake.
 */
import type { AppConfig } from "../config/app-config";
import { authContextHeaders, missingAuthContext } from "../config/app-config";

/**
 * Request budget for every API call, reads and writes alike.
 *
 * Five minutes: the ORDS endpoints can take minutes to wake a cold pool or to
 * process a full financial-evaluation PUT, and aborting early surfaced as a
 * "timed out" error on requests the server was still completing.
 */
export const REQUEST_TIMEOUT_MS = 300_000;

const DEFAULT_TIMEOUT_MS = REQUEST_TIMEOUT_MS;

/**
 * Pull a human message out of a JSON error body, trying the field names used
 * across the ORDS endpoints (apiMessage/api_message) and Oracle's standard
 * error shape ({code, message, type, instance}). Returns undefined for a
 * non-JSON body or one without a recognised message field, so the caller can
 * fall back to the raw text.
 */
export function extractApiErrorMessage(text: string): string | undefined {
  if (!text.trim()) return undefined;
  try {
    const json = JSON.parse(text) as Record<string, unknown>;
    const message = json.apiMessage ?? json.api_message ?? json.message ?? json.error_message;
    return typeof message === "string" && message.trim() ? message : undefined;
  } catch {
    return undefined;
  }
}


/**
 * Warn once per page load when the host didn't supply role / user_email.
 * Every endpoint would otherwise log the same line, burying the one message
 * that explains the 403s.
 */
let authContextWarned = false;

function warnMissingAuthContext(missing: string[]): void {
  if (authContextWarned || missing.length === 0) return;
  authContextWarned = true;
  console.error(
    `[http] window.__APP_CONFIG__ is missing ${missing.join(" and ")} — these are sent as ` +
      `request headers and the ORDS endpoints reject the call (403 "not authorised") without them. ` +
      `The APEX plugin must populate them from the signed-in user; see index.html for the shape.`,
  );
}

export async function fetchJson<T>(
  url: string,
  token: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
  extraHeaders?: Record<string, string | number | null | undefined>,
  cfg?: AppConfig,
): Promise<T> {
  const controller = new AbortController();
  const secs = Math.round(timeoutMs / 1000);
  const timeout = setTimeout(
    () => controller.abort(new DOMException(`Request timed out after ${secs}s`, "TimeoutError")),
    timeoutMs,
  );

  // `role` / `user_email` are required by every ORDS endpoint (403 without them)
  // so they're applied here rather than at each call site. Any extra headers
  // (e.g. KPIVariance's proposal_id / spc_type_id) are stringified; null and
  // undefined values are dropped so we never send the string "null".
  //
  // The caller's cfg is used when given, so a request always carries the auth
  // context of the config it was built from rather than re-reading the global.
  const authHeaders = authContextHeaders(cfg);
  const missingAuth = missingAuthContext(cfg);
  warnMissingAuthContext(missingAuth);

  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
  for (const [key, value] of Object.entries({ ...authHeaders, ...extraHeaders })) {
    if (value != null) headers[key] = String(value);
  }

  let res: Response;
  try {
    res = await fetch(url, {
      headers,
      signal: controller.signal,
    });
  } catch (err) {
    // Turn the abort/network failure into a human-readable message.
    if (controller.signal.aborted) {
      const reason = controller.signal.reason as unknown;
      const msg =
        reason instanceof Error || reason instanceof DOMException
          ? reason.message
          : `Request timed out after ${secs}s`;
      throw new Error(msg, { cause: err });
    }
    throw err instanceof Error ? err : new Error(String(err));
  } finally {
    clearTimeout(timeout);
  }

  // Read the body as text first so we can (a) include ORDS's error body in the
  // message when the call fails and (b) tolerate an empty 200/204 response
  // instead of crashing on `res.json()` with "Unexpected end of JSON input".
  const text = await res.text();

  if (!res.ok) {
    // A 403 here is almost always the endpoint's own authorisation check, which
    // reads the role grants. Say so when the headers went out incomplete —
    // otherwise the ORDS message ("not authorised to view this…") reads like a
    // data problem when it's really a missing config value.
    const hint =
      res.status === 403 && missingAuth.length > 0
        ? ` — sent without ${missingAuth.join(" and ")}; set ${missingAuth.join(" / ")} in window.__APP_CONFIG__`
        : "";
    const apiMessage = extractApiErrorMessage(text);
    throw new Error(
      `${apiMessage || `HTTP ${res.status}: ${res.statusText}${text ? ` — ${text.slice(0, 300)}` : ""}`}${hint}`,
    );
  }

  // Empty body (no content) → hand back an empty object. The transformers use
  // optional chaining, so they render an empty state rather than throwing.
  if (!text.trim()) return {} as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Expected JSON from ${url} but received a non-JSON response: ${text.slice(0, 200)}`);
  }
}
