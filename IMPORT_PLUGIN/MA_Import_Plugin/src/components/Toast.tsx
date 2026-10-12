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
      className={`mna:fixed mna:top-[50px] mna:right-5 mna:z-[400] mna:mt-2.5 mna:flex mna:max-w-[472px] mna:min-w-[260px] mna:items-center mna:gap-2.5 mna:rounded-lg mna:px-3.5 mna:py-3 mna:text-[13px] mna:font-semibold mna:shadow-[0_6px_20px_rgba(0,0,0,.18)] ${
        isSuccess ? "mna:bg-[#f4fceb] mna:text-[#436b1d]" : "mna:bg-white mna:text-[#111827]"
      }`}
    >
      <Icon size={18} className="mna:shrink-0" />
      <span className="mna:flex-1">{toast.message}</span>
      {toast.action && (
        <button
          type="button"
          onClick={toast.action.onClick}
          className="mna:shrink-0 mna:rounded mna:border mna:border-current mna:px-2 mna:py-[3px] mna:text-[12px] mna:font-semibold mna:whitespace-nowrap"
        >
          {toast.action.label}
        </button>
      )}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="mna:flex mna:cursor-pointer mna:border-none mna:bg-transparent mna:p-0"
      >
        <X size={14} />
      </button>
    </div>
  );
}
