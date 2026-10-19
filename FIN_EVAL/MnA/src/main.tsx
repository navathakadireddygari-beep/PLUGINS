import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/globals.css";
import type { AppConfig } from "./config/app-config";

declare global {
  interface Window {
    __APP_CONFIG__?: AppConfig;

    __GIS_INVEST_INIT_DONE__?: boolean;

    __mnaInvestmentReportMount?: MountState;

    InvestmentReportWidget?: {
      init: (
        hostId: string,
        config: AppConfig
      ) => void;

      destroy: (
        hostId: string
      ) => void;
    };
  }
}

type MountState = {
  root: ReturnType<typeof ReactDOM.createRoot> | null;
  container: HTMLElement | null;
  key: string | null;
};

/*
 * Keep track of the currently mounted React root, together with the DOM node
 * it was created against and the ids it is showing.
 *
 * APEX can replace the host element out from under us — e.g. a native AJAX
 * region refresh (see the "reinit-investment-report" custom event on the
 * host page) swaps the region's HTML, including this exact <div>, BEFORE our
 * destroy() ever runs. If that happens, `_mount.root` still points at the
 * OLD, now-detached element. Calling `.unmount()` on it doesn't touch the new
 * element APEX just inserted, and it is still needed: without it the old tree
 * stays alive, and its listeners (host refresh event, AppBridge) keep firing
 * GETs next to the new widget's. Tracking the container lets destroy()/init()
 * tell a replaced host element from the current one.
 *
 * Kept on window (not module scope) so that if the APEX page loads this
 * bundle more than once, every copy sees the same mount and can't add a
 * second live widget. The name is this plugin's own: other plugins expose the
 * same `InvestmentReportWidget` global and keep their own mount record.
 */
const _mount: MountState =
  (window.__mnaInvestmentReportMount ??= {
    root: null,
    container: null,
    key: null,
  });

/*
 * Identifies what a mount is showing.
 */
const mountKey = (c: AppConfig): string =>
  [c?.proposal_id, c?.spc_type_id, c?.template_type_id]
    .map((id) => id ?? "")
    .join("|");


/* ============================================================
 * DESTROY
 * ============================================================ */
function destroy(hostId: string): void {
  const liveContainer = document.getElementById(hostId);

  /*
   * If APEX already swapped the host element (e.g. a native AJAX region
   * refresh ran before destroy() was called), `_mount.container` is a
   * detached node that no longer represents anything on the live page.
   * The root is unmounted either way (see the note on `_mount` above).
   */
  const containerStillCurrent =
    _mount.container !== null && _mount.container === liveContainer;

  try {
    if (_mount.root) {
      _mount.root.unmount();

      if (containerStillCurrent) {
        console.log(
          "[InvestmentReport] destroy() unmounted:",
          hostId
        );
      } else {
        console.warn(
          "[InvestmentReport] destroy() unmounted a root " +
          "whose host element was already replaced:",
          hostId
        );
      }
    }
  } catch (error) {
    console.warn(
      "[InvestmentReport] destroy() error:",
      error
    );
  } finally {
    _mount.root = null;
    _mount.container = null;
    _mount.key = null;
  }

  /*
   * Clear the container as a safety net.
   */
  const container =
    document.getElementById(hostId);

  if (container) {
    container.innerHTML = "";
  }

  window.__GIS_INVEST_INIT_DONE__ =
    false;
}


/* ============================================================
 * INIT
 * ============================================================ */
function init(
  hostId: string,
  config: AppConfig
): void {
  console.log(
    "[InvestmentReport] init() called:",
    {
      hostId,
      proposal_id:
        config?.proposal_id,

      spc_type_id:
        config?.spc_type_id,

      template_type_id:
        config?.template_type_id,
    }
  );

  const container =
    document.getElementById(hostId);

  if (!container) {
    console.error(
      "[InvestmentReport] Mount container not found:",
      hostId
    );

    return;
  }

  /*
   * IMPORTANT:
   * Update config BEFORE React mounts.
   *
   * Use a fresh object so React gets the
   * latest proposal information.
   */
  window.__APP_CONFIG__ = {
    ...config,
  };


  /*
   * init() runs on page load (auto-mount below) AND whenever APEX calls
   * InvestmentReportWidget.init. Same container + same ids → keep the live
   * widget (a second root would do its own GET and listen for refresh events
   * too). Anything else → unmount the old root before mounting fresh,
   * including one whose container APEX has since replaced (see the note on
   * `_mount` above): its DOM is gone but its listeners are still live.
   */
  if (_mount.root) {
    if (
      _mount.container === container &&
      container.isConnected &&
      _mount.key === mountKey(config)
    ) {
      return;
    }

    try {
      _mount.root.unmount();
    } catch (error) {
      console.warn(
        "[InvestmentReport] Previous root unmount error:",
        error
      );
    }
  }

  _mount.root = null;
  _mount.container = null;
  _mount.key = null;


  /*
   * Remove any previous DOM left in the host.
   */
  container.innerHTML = "";


  /*
   * Create fresh React root.
   */
  _mount.root =
    ReactDOM.createRoot(container);
  _mount.container = container;
  _mount.key = mountKey(config);


  /*
   * Render React application.
   */
  _mount.root.render(
    // <React.StrictMode>
      <App />
    // </React.StrictMode>
  );


  window.__GIS_INVEST_INIT_DONE__ =
    true;


  console.log(
    "[InvestmentReport] init() mounted successfully:",
    {
      hostId,

      proposal_id:
        window.__APP_CONFIG__
          ?.proposal_id,
    }
  );
}


/* ============================================================
 * EXPOSE API FOR APEX
 * ============================================================ */

window.InvestmentReportWidget = {
  init,
  destroy,
};

console.log(
  "[InvestmentReportWidget] " +
  "Bundle loaded. Widget API registered."
);


/* ============================================================
 * INITIAL AUTO-MOUNT
 *
 * Same approach as Sales Contract.
 * ============================================================ */

const _initialConfig =
  window.__APP_CONFIG__;

const _hasInitialConfig =
  !!_initialConfig &&
  (
    _initialConfig.proposal_id != null ||
    _initialConfig.spc_type_id != null ||
    _initialConfig.template_type_id != null
  );


if (_hasInitialConfig) {
  console.log(
    "[InvestmentReport Init] Initial config found:",
    {
      proposal_id:
        _initialConfig.proposal_id,

      spc_type_id:
        _initialConfig.spc_type_id,

      template_type_id:
        _initialConfig.template_type_id,
    }
  );

  init(
    "root",
    _initialConfig
  );
} else {
  console.warn(
    "[InvestmentReport Init] " +
    "No valid proposal_id, spc_type_id " +
    "or template_type_id on page load."
  );
}