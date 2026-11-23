/**
 * AdminMessagesService
 * --------------------
 * GET /GIS/adminManagement/messages?message_code={code}
 *   → { apiStatus, apiMessage, data: { items: [{ message_code, message_text, status, ... }] } }
 *
 * Admin-maintained UI copy (e.g. the hint beside Validate / Save Model), so the
 * text can change without redeploying the plugin.
 */

import { apiClient, ApiError } from "@/lib/axios";
import type { ApiEnvelope } from "@/config/app-config";

export const ADMIN_MESSAGES_PATH = "/GIS/adminManagement/messages";

/** Hint shown beside the Back / Validate / Save Model buttons. */
export const IMPORT_FE_LOAD_MSG = "XXEXP_GIS_IMPORT_FE_LOAD_MSG";

interface AdminMessage {
  message_code?: string;
  message_text?: string | null;
  status?: string | null;
}

// Messages don't change during a page session — one request per code (the
// promise itself, so concurrent callers share it). A failed request is evicted
// so a later mount can retry.
const messageCache = new Map<string, Promise<string>>();

const fetchAdminMessage = async (code: string): Promise<string> => {
  const { data: body } = await apiClient.get<ApiEnvelope<AdminMessage[]>>(
    ADMIN_MESSAGES_PATH,
    { params: { message_code: code }, headers: { language: "US" } },
  );
  if (body?.apiStatus !== "S") {
    throw new ApiError(body?.apiMessage || `Failed to load message ${code}.`);
  }
  const item = (body.data?.items ?? []).find(
    (m) => m.message_code === code && (m.status ?? "ACTIVE").toUpperCase() === "ACTIVE",
  );
  return item?.message_text?.trim() ?? "";
};

/** message_text of the ACTIVE message for `code`, or "" when there is none. */
export const getAdminMessage = (code: string): Promise<string> => {
  const cached = messageCache.get(code);
  if (cached) return cached;
  const request = fetchAdminMessage(code);
  messageCache.set(code, request);
  request.catch(() => messageCache.delete(code));
  return request;
};
