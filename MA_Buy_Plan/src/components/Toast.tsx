/**
 * Transient success / error notice, ported from FIN_EVAL/MA
 * src/components/Toast.tsx so save feedback looks and behaves the same.
 * Fixed to the top-right and auto-dismisses. Icons are lucide's
 * CheckCircle2 / AlertCircle / X, inlined (Buy Plan has no lucide dependency).
 */

import { useEffect } from "react";

export type ToastKind = "success" | "error";

export type ToastState = { kind: ToastKind; message: string } | null;

type Props = {
  toast: ToastState;
  onClose: () => void;
  autoDismissMs?: number;
};

const iconProps = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
  "aria-hidden": true,
};

export default function Toast({ toast, onClose, autoDismissMs = 3500 }: Props) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onClose, autoDismissMs);
    return () => clearTimeout(timer);
  }, [toast, autoDismissMs, onClose]);

  if (!toast) return null;

  const isSuccess = toast.kind === "success";

  return (
    <div role="status" className={`bp-toast ${isSuccess ? "bp-toast--success" : "bp-toast--error"}`}>
      <svg width={18} height={18} className="bp-toast-icon" {...iconProps}>
        <circle cx="12" cy="12" r="10" />
        {isSuccess ? (
          <path d="m9 12 2 2 4-4" />
        ) : (
          <>
            <line x1="12" x2="12" y1="8" y2="12" />
            <line x1="12" x2="12.01" y1="16" y2="16" />
          </>
        )}
      </svg>
      <span className="bp-toast-message">{toast.message}</span>
      <button type="button" onClick={onClose} aria-label="Close" className="bp-toast-close">
        <svg width={14} height={14} {...iconProps}>
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>
    </div>
  );
}
