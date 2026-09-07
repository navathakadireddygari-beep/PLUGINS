/**
 * Shared axios client for the GIS REST API.
 *
 * Every request is stamped with the bearer token from TokenService plus the
 * `role` / `user_email` headers the gateway expects. A 401 is retried once
 * against a freshly minted token, which covers a token expiring mid-session.
 */

import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import {
  API_BASE_URL,
  authHeaders,
  type ApiEnvelope,
} from "@/config/app-config";
import { getAccessToken } from "@/api/auth-api";

/** Error carrying the HTTP status (0 for transport/envelope failures). */
export class ApiError extends Error {
  readonly status: number;
  constructor(message: string, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** Marks a config that has already been retried, so we retry at most once. */
interface RetriableConfig extends InternalAxiosRequestConfig {
  _retriedWithFreshToken?: boolean;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use(async (config) => {
  Object.entries(authHeaders(await getAccessToken())).forEach(([key, value]) =>
    config.headers.set(key, value),
  );
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    if (
      error.response?.status === 401 &&
      config &&
      !config._retriedWithFreshToken
    ) {
      config._retriedWithFreshToken = true;
      config.headers.set(
        "authorization",
        `Bearer ${await getAccessToken(true)}`,
      );
      return apiClient.request(config);
    }
    throw error;
  },
);

/** Normalize any thrown value into an ApiError. */
const toApiError = (error: unknown, path: string): ApiError => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 0;
    const apiMessage = (
      error.response?.data as ApiEnvelope<unknown> | undefined
    )?.apiMessage;
    return new ApiError(
      apiMessage ?? `Request to ${path} failed${status ? ` (${status})` : ""}`,
      status,
    );
  }
  return new ApiError(
    error instanceof Error ? error.message : `Request to ${path} failed`,
  );
};

/**
 * GET a GIS endpoint and unwrap `data.items`, throwing `ApiError` on a
 * transport failure or a non-"S" `apiStatus`.
 */
export const getItems = async <T>(
  path: string,
  params?: Record<string, string | number | undefined>,
  signal?: AbortSignal,
): Promise<T> => {
  let body: ApiEnvelope<T>;
  try {
    const config: AxiosRequestConfig = { params, signal };
    ({ data: body } = await apiClient.get<ApiEnvelope<T>>(path, config));
  } catch (error) {
    throw toApiError(error, path);
  }

  if (body.apiStatus !== "S" || body.data?.items === undefined) {
    throw new ApiError(body.apiMessage || `Request to ${path} failed`);
  }
  return body.data.items;
};

/**
 * PUT a GIS endpoint and unwrap `data.items`.
 *
 * Save endpoints are looser than the read ones: some answer with the usual
 * envelope, others with a bare 204 / empty body. So the HTTP status is what
 * decides success (a non-2xx already threw), and the envelope is only consulted
 * when one was actually sent — an `apiStatus` other than "S" still fails.
 */
export const putItems = async <T>(
  path: string,
  data: unknown,
  signal?: AbortSignal,
): Promise<T | undefined> => {
  let body: ApiEnvelope<T> | "" | null | undefined;
  try {
    const config: AxiosRequestConfig = { signal };
    ({ data: body } = await apiClient.put<ApiEnvelope<T>>(path, data, config));
  } catch (error) {
    throw toApiError(error, path);
  }

  if (!body || typeof body !== "object") return undefined;
  if (body.apiStatus !== undefined && body.apiStatus !== "S") {
    throw new ApiError(body.apiMessage || `Request to ${path} failed`);
  }
  return body.data?.items;
};

/**
 * DELETE a GIS endpoint, sending `data` as the request body.
 *
 * DELETE-with-a-body is unusual but is what this API expects (the row to remove
 * is named in the body, not the path). Success is judged the same way `putItems`
 * judges it: the HTTP status decides, and the envelope is only consulted when
 * one was actually returned.
 */
export const deleteItems = async <T>(
  path: string,
  data: unknown,
  signal?: AbortSignal,
): Promise<T | undefined> => {
  let body: ApiEnvelope<T> | "" | null | undefined;
  try {
    const config: AxiosRequestConfig = { data, signal };
    ({ data: body } = await apiClient.delete<ApiEnvelope<T>>(path, config));
  } catch (error) {
    throw toApiError(error, path);
  }

  if (!body || typeof body !== "object") return undefined;
  if (body.apiStatus !== undefined && body.apiStatus !== "S") {
    throw new ApiError(body.apiMessage || `Request to ${path} failed`);
  }
  return body.data?.items;
};

/**
 * POST a GIS endpoint and unwrap `data.items`, throwing `ApiError` on a
 * transport failure or a non-"S" `apiStatus`.
 */
export const postItems = async <T>(
  path: string,
  data: unknown,
  signal?: AbortSignal,
): Promise<T> => {
  let body: ApiEnvelope<T>;
  try {
    const config: AxiosRequestConfig = { signal };
    ({ data: body } = await apiClient.post<ApiEnvelope<T>>(path, data, config));
  } catch (error) {
    throw toApiError(error, path);
  }

  if (body.apiStatus !== "S" || body.data?.items === undefined) {
    throw new ApiError(body.apiMessage || `Request to ${path} failed`);
  }
  return body.data.items;
};
