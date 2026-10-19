// import React from "react";
// import ReactDOM from "react-dom/client";
// import App from "./App";
// import "./styles/globals.css";


// ReactDOM.createRoot(document.getElementById("root")!).render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// );

// import React from "react";
// import ReactDOM from "react-dom/client";
// import App from "./App";
// import "./styles/globals.css";

// // Changed from 'root' to 'investment-report-root'
// ReactDOM.createRoot(
//   document.getElementById("investment-report-root")!
// ).render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// );


import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/globals.css";

type AppConfig = {
  proposal_id: number | null;
  file_id?: number | null;
  spc_type_id: number | null;
  template_type_id: number | null;
  app_user: string;
  api_endpoint: string;
  ajaxId: string;
  flowId: string;
  stepId: string;
  instance: string;
};

type MountState = {
  root:      ReturnType<typeof ReactDOM.createRoot> | null;
  container: HTMLElement | null;
  key:       string | null;
};
// Kept on window (not module scope) so that if the APEX page loads this
// bundle more than once, every copy sees the same mount and can't add a
// second live widget. Named for this plugin so it can't collide with another
// plugin that also exposes window.InvestmentReportWidget.
const w = window as any;
const mount: MountState = (w.__otherCapexOpexSimpleFinImportMount ??= { root: null, container: null, key: null });

// Identifies which proposal/template/import file a mount is showing.
const mountKey = (c: AppConfig): string => `${c.proposal_id}|${c.file_id}|${c.spc_type_id}|${c.template_type_id}`;

function init(hostId: string, config: AppConfig): void {
  const container = document.getElementById(hostId);

  if (!container) {
    console.error("[InvestmentReport] Mount container not found:", hostId);
    return;
  }

  /* Update global config before mounting */
  (window as any).__APP_CONFIG__ = config;

  // init() runs on page load (auto-mount below) AND whenever APEX calls
  // InvestmentReportWidget.init. Previously each call created another React
  // root without unmounting the old one, so several copies of the widget ran
  // at once, each doing its own GET / account-code calls and each listening
  // for refresh events. Now: same container + same proposal → keep the live
  // widget; anything else → unmount the old one before mounting fresh.
  if (mount.root) {
    if (mount.container === container && container.isConnected && mount.key === mountKey(config)) {
      return;
    }
    mount.root.unmount();
    mount.root = null;
    mount.container = null;
    mount.key = null;
  }

  /* Create a fresh React root and render */
  mount.root = ReactDOM.createRoot(container);
  mount.container = container;
  mount.key = mountKey(config);
  mount.root.render(
    // <React.StrictMode>
      <App />
    // </React.StrictMode>
  );

  //console.log("[InvestmentReport] init() mounted for proposal_id:", config.proposal_id);
}

function destroy(hostId: string): void {
  if (mount.root) {
    mount.root.unmount();
    mount.root = null;
    mount.container = null;
    mount.key = null;
    //console.log("[InvestmentReport] destroy() unmounted from:", hostId);
  }

  /* Clear the container innerHTML as a safety net */
  const container = document.getElementById(hostId);
  if (container) {
    container.innerHTML = "";
  }
}

/* Expose on window so APEX DA can call init/destroy */
(window as any).InvestmentReportWidget = { init, destroy };


/* ── Auto-mount on page load if __APP_CONFIG__ already has a valid proposal_id ──
   This handles the normal page load case (existing proposal opened directly).   */
const _initialConfig = (window as any).__APP_CONFIG__;

const hasId = _initialConfig &&
  (_initialConfig.proposal_id != null || _initialConfig.spc_type_id != null || _initialConfig.template_type_id != null);

if (hasId) {
  init("investment-report-root", _initialConfig);
} else {
  console.warn("[InvestmentReport Init] No valid proposal_id or spc_type_id on page load.");
}
