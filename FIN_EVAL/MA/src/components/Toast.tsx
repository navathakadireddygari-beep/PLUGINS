/**
 * Transient success / error notice, ported from the reference project
 * (Prod Dev → src/components/Toast.tsx) so save, delete and paste feedback
 * looks and behaves the same in both widgets.
 *
 * Fixed to the top-right, auto-dismisses, and optionally carries one action
 * button (used for the "Undo" affordance after a paste).
 */

import { useEffect } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

export type ToastKind = "success" | "error";

export type ToastState = {
  kind: ToastKind;
  message: string;
  action?: { label: string; onClick: () => void };
} | null;

type Props = {
  toast: ToastState;
  onClose: () => void;
  autoDismissMs?: number;
};

export default function Toast({ toast, onClose, autoDismissMs = 3500 }: Props) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onClose, autoDismissMs);
    return () => clearTimeout(timer);
  }, [toast, autoDismissMs, onClose]);

  if (!toast) return null;

  const isSuccess = toast.kind === "success";
  const Icon = isSuccess ? CheckCircle2 : AlertCircle;

  return (
    <div
      role="status"
      className={`fixed top-[50px] right-5 z-[400] mt-2.5 flex max-w-[472px] min-w-[260px] items-center gap-2.5 rounded-lg px-3.5 py-3 text-[13px] font-semibold shadow-[0_6px_20px_rgba(0,0,0,.18)] ${
        isSuccess ? "bg-[#f4fceb] text-[#436b1d]" : "bg-white text-[#111827]"
      }`}
    >
      <Icon size={18} className="shrink-0" />
      <span className="flex-1">{toast.message}</span>
      {toast.action && (
        <button
          type="button"
          onClick={toast.action.onClick}
          className="shrink-0 rounded border border-current px-2 py-[3px] text-[12px] font-semibold whitespace-nowrap"
        >
          {toast.action.label}
        </button>
      )}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="flex cursor-pointer border-none bg-transparent p-0"
      >
        <X size={14} />
      </button>
    </div>
  );
}
