import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { getAdminMessage, IMPORT_FE_LOAD_MSG } from "@/api/messages-api";

/**
 * Admin-maintained hint shown beside Back / Validate / Save Model.
 * Renders nothing until the text loads, or if the request fails — the hint is
 * optional and must never block the action bar.
 */
export default function LoadMessageBanner() {
  const [text, setText] = useState("");

  useEffect(() => {
    let alive = true;
    getAdminMessage(IMPORT_FE_LOAD_MSG)
      .then((t) => { if (alive) setText(t); })
      .catch(() => { /* optional hint — leave the bar as it was */ });
    return () => { alive = false; };
  }, []);

  if (!text) return null;

  return (
    <div
      role="note"
      className="mna:flex mna:min-w-0 mna:items-center mna:gap-2 mna:rounded-md mna:border mna:border-l-4 mna:border-[#A7F3D0] mna:border-l-[#059669] mna:bg-[#ECFDF5] mna:px-3 mna:py-[7px] mna:text-[12.5px] mna:font-medium mna:leading-snug mna:text-[#065F46]"
    >
      <Info size={15} className="mna:shrink-0 mna:text-[#059669]" />
      <span><strong style={{ fontWeight: 700 }}>Note:</strong> {text}</span>
    </div>
  );
}
