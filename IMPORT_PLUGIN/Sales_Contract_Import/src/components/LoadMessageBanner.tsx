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

  // The outer box takes the free width left of the buttons, so the banner
  // starts at the left edge. A zero basis means it only ever takes the space
  // the buttons leave, so long text wraps instead of squeezing the buttons.
  // Colours match the success toast (Toast.tsx).
  return (
    <div style={{ flex: "1 1 0%", minWidth: 0, display: "flex", marginRight: 12 }}>
      <div
        role="note"
        style={{ minWidth: 0, display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", background: "#f4fceb", borderLeft: "4px solid #436b1d", borderRadius: 6, color: "#436b1d", fontSize: 12.5, fontWeight: 500, lineHeight: 1.4 }}
      >
        <Info size={15} style={{ flexShrink: 0 }} />
        <span style={{ minWidth: 0, overflowWrap: "anywhere" }}><strong style={{ fontWeight: 700 }}>Note:</strong> {text}</span>
      </div>
    </div>
  );
}
