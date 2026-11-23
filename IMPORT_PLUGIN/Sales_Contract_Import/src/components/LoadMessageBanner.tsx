import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { getAppConfig } from "../config/app-config";
import { getAdminMessage, IMPORT_FE_LOAD_MSG } from "../api/messages-api";

/**
 * Admin-maintained hint shown beside Back / Validate / Save Model.
 * Renders nothing until the text loads, or if the request fails — the hint is
 * optional and must never block the action bar.
 */
export default function LoadMessageBanner() {
  const [text, setText] = useState("");

  useEffect(() => {
    let alive = true;
    getAdminMessage(getAppConfig(), IMPORT_FE_LOAD_MSG)
      .then((t) => { if (alive) setText(t); })
      .catch(() => { /* optional hint — leave the bar as it was */ });
    return () => { alive = false; };
  }, []);

  if (!text) return null;

  return (
    <div
      role="note"
      style={{ flex: "0 1 auto", minWidth: 0, marginRight: 12, display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", background: "#ECFDF5", border: "1px solid #A7F3D0", borderLeft: "4px solid #059669", borderRadius: 6, color: "#065F46", fontSize: 12.5, fontWeight: 500, lineHeight: 1.4 }}
    >
      <Info size={15} style={{ flexShrink: 0, color: "#059669" }} />
      <span><strong style={{ fontWeight: 700 }}>Note:</strong> {text}</span>
    </div>
  );
}
