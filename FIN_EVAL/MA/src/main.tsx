import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/globals.css";
import type { AppConfig } from "./config/app-config";

declare global {
  interface Window {
    __APP_CONFIG__?: AppConfig;

    __GIS_INVEST_INIT_DONE__?: boolean;

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

/*
 * Keep track of the currently mounted React root, together with the DOM node
 * it was created against.
 *
 * APEX can replace the host element out from under us — e.g. a native AJAX
 * region refresh (see the "reinit-investment-report" custom event on the
 * host page) swaps the region's HTML, including this exact <div>, BEFORE our
 * destroy() ever runs. If that happens, `_reactRoot` still points at the OLD,
 * now-detached element. Calling `.unmount()` on it doesn't touch the new
 * element APEX just inserted, but it also doesn't hurt — the real danger is
 * anything (a stray native event, a late async setState) later assuming
 * `_reactRoot`/`_mountedContainer` are still attached to the live document.
 * Tracking the container lets destroy()/init() detect that mismatch and skip
 * operating on the stale node instead of unmounting/reconciling against DOM
 * React no longer actually owns.
 */
let _reactRoot:
  ReturnType<typeof ReactDOM.createRoot> | null =
  null;
let _mountedContainer: HTMLElement | null = null;


/* ============================================================
 * DESTROY
 * ============================================================ */
function destroy(hostId: string): void {
  const liveContainer = document.getElementById(hostId);

  /*
   * If APEX already swapped the host element (e.g. a native AJAX region
   * refresh ran before destroy() was called), `_mountedContainer` is a
   * detached node that no longer represents anything on the live page.
   * Unmounting into it can't affect the new element, so skip straight to
   * discarding the stale reference rather than risking a call into a fiber
   * tree whose DOM was pulled out from under it.
   */
  const containerStillCurrent =
    _mountedContainer !== null && _mountedContainer === liveContainer;

  try {
    if (_reactRoot && containerStillCurrent) {
      _reactRoot.unmount();

      console.log(
        "[InvestmentReport] destroy() unmounted:",
        hostId
      );
    } else if (_reactRoot) {
      console.warn(
        "[InvestmentReport] destroy() skipped unmount " +
        "— host element was already replaced:",
        hostId
      );
    }
  } catch (error) {
    console.warn(
      "[InvestmentReport] destroy() error:",
      error
    );
  } finally {
    _reactRoot = null;
    _mountedContainer = null;
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
   * Protect against APEX calling init() without destroy() first — and guard
   * against unmounting into a container APEX has since replaced (see the
   * note on `_mountedContainer` above). If the tracked container isn't the
   * one currently in the document, it's already been swapped out from under
   * us, so there is nothing live left to unmount.
   */
  if (_reactRoot && _mountedContainer === container) {
    try {
      _reactRoot.unmount();
    } catch (error) {
      console.warn(
        "[InvestmentReport] Previous root unmount error:",
        error
      );
    }
  }

  _reactRoot = null;
  _mountedContainer = null;


  /*
   * Remove any previous DOM left in the host.
   */
  container.innerHTML = "";


  /*
   * Create fresh React root.
   */
  _reactRoot =
    ReactDOM.createRoot(container);
  _mountedContainer = container;


  /*
   * Render React application.
   */
  _reactRoot.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
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