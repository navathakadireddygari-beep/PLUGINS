import React, { useEffect } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

export type ToastKind = "success" | "error";

export type ToastState = {
  kind:    ToastKind;
  message: string;
} | null;

type Props = {
  toast:        ToastState;
  onClose:      () => void;
  autoDismissMs?: number;
};

export default function Toast({ toast, onClose, autoDismissMs = 3500 }: Props): React.ReactElement | null {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClose, autoDismissMs);
    return () => clearTimeout(t);
  }, [toast, autoDismissMs, onClose]);

  if (!toast) return null;

  const isSuccess = toast.kind === "success";
  const bg        = isSuccess ? "#f4fceb" : "#dc2626";
  const Icon      = isSuccess ? CheckCircle2 : AlertCircle;

  return (
    <div
      role="status"
      style={{
        position: "fixed", top: 50, right: 20, zIndex: 400,
        display: "flex", alignItems: "center", gap: 10,
        minWidth: 260, maxWidth: 472,
        padding: "12px 14px",
        marginTop: 10,
        background: bg, color: "#436b1d",
        borderRadius: 8, boxShadow: "0 6px 20px rgba(0,0,0,.18)",
        fontSize: 13, fontWeight: 600,
      }}
    >
      <Icon size={18} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button
        type="button"
        onClick={onClose}
        style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 0, display: "flex" }}
        aria-label="Close"
      >
        <X size={14} />
      </button>
    </div>
  );
}
