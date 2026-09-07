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
 * Keep track of the currently mounted React root.
 */
let _reactRoot:
  ReturnType<typeof ReactDOM.createRoot> | null =
  null;


/* ============================================================
 * DESTROY
 * ============================================================ */
function destroy(hostId: string): void {
  try {
    if (_reactRoot) {
      _reactRoot.unmount();
      _reactRoot = null;

      console.log(
        "[InvestmentReport] destroy() unmounted:",
        hostId
      );
    }
  } catch (error) {
    console.warn(
      "[InvestmentReport] destroy() error:",
      error
    );

    _reactRoot = null;
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
   * Protect against APEX calling init()
   * without destroy() first.
   */
  if (_reactRoot) {
    try {
      _reactRoot.unmount();
    } catch (error) {
      console.warn(
        "[InvestmentReport] Previous root unmount error:",
        error
      );
    }

    _reactRoot = null;
  }


  /*
   * Remove any previous DOM left in the host.
   */
  container.innerHTML = "";


  /*
   * Create fresh React root.
   */
  _reactRoot =
    ReactDOM.createRoot(container);


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