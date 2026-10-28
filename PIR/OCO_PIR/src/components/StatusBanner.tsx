/**
 * Status banner — mirrors Oracle APEX's native page-level notifications: amber
 * "N error(s) has occurred" for failures, green checkmark for success. Success
 * auto-dismisses; errors stay until the user closes them.
 */
import { useEffect, type ReactElement } from "react";

export type BannerKind = "success" | "error";

type Props = {
  kind:     BannerKind;
  /** One entry per message; the banner is hidden when this is empty. */
  messages: string[];
  onClose:  () => void;
  /** Auto-dismiss after this many ms. Omit to require a manual close. */
  autoDismissMs?: number;
};

export default function StatusBanner({ kind, messages, onClose, autoDismissMs }: Props): ReactElement | null {
  useEffect(() => {
    if (messages.length === 0 || !autoDismissMs) return;
    const t = window.setTimeout(onClose, autoDismissMs);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, autoDismissMs]);

  if (messages.length === 0) return null;

  const isError = kind === "error";

  return (
    <div className={`pir-pd-status-banner pir-pd-status-banner-${kind}`} role={isError ? "alert" : "status"}>
      <div className="pir-pd-status-banner-header">
        <span className="pir-pd-status-banner-icon" aria-hidden="true">{isError ? "⚠" : "✓"}</span>
        <span className="pir-pd-status-banner-title">
          {isError
            ? `${messages.length} error${messages.length === 1 ? "" : "s"} has occurred`
            : messages[0]}
        </span>
        <button
          type="button"
          className="pir-pd-status-banner-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
      </div>
      {isError && (
        <ul className="pir-pd-status-banner-list">
          {messages.map((message, i) => (
            <li key={i}>{message}</li>
          ))}
        </ul>
      )}

      <style>{`
        .pir-pd-status-banner {
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 600;
          min-width: 320px;
          max-width: 440px;
          border-radius: 8px;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.16);
          padding: 14px 16px;
        }
        .pir-pd-status-banner-error {
          background: #fdf6e3;
          border: 1px solid #f2d492;
        }
        .pir-pd-status-banner-success {
          background: #eafbea;
          border: 1px solid #a7e3ab;
        }
        .pir-pd-status-banner-header {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .pir-pd-status-banner-icon {
          font-size: 16px;
          line-height: 1;
        }
        .pir-pd-status-banner-error .pir-pd-status-banner-icon,
        .pir-pd-status-banner-error .pir-pd-status-banner-title,
        .pir-pd-status-banner-error .pir-pd-status-banner-close {
          color: #92400e;
        }
        .pir-pd-status-banner-success .pir-pd-status-banner-icon,
        .pir-pd-status-banner-success .pir-pd-status-banner-title,
        .pir-pd-status-banner-success .pir-pd-status-banner-close {
          color: #166534;
        }
        .pir-pd-status-banner-title {
          flex: 1;
          font-weight: 700;
          font-size: 14px;
        }
        .pir-pd-status-banner-close {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 16px;
          line-height: 1;
          padding: 0;
        }
        .pir-pd-status-banner-list {
          margin: 8px 0 0;
          padding-left: 18px;
          font-size: 13px;
          color: #78350f;
        }
        .pir-pd-status-banner-list li {
          margin-bottom: 2px;
        }
      `}</style>
    </div>
  );
}
