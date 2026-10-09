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


import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/globals.css";

type AppConfig = {
  proposal_id: number | null;
  spc_type_id: number | null;
  app_user: string;
  api_endpoint: string;
  ajaxId: string;
  flowId: string;
  stepId: string;
  instance: string;
};

let _reactRoot: ReturnType<typeof ReactDOM.createRoot> | null = null;

function init(hostId: string, config: AppConfig): void {
  const container = document.getElementById(hostId);

  if (!container) {
    console.error("[InvestmentReport] Mount container not found:", hostId);
    return;
  }

  /* Update global config before mounting */
  (window as any).__APP_CONFIG__ = config;

  /* Create a fresh React root and render */
  _reactRoot = ReactDOM.createRoot(container);
  _reactRoot.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  //console.log("[InvestmentReport] init() mounted for proposal_id:", config.proposal_id);
}

function destroy(hostId: string): void {
  if (_reactRoot) {
    _reactRoot.unmount();
    _reactRoot = null;
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
  (_initialConfig.proposal_id != null || _initialConfig.spc_type_id != null);

if (hasId) {
  init("investment-report-root", _initialConfig);
} else {
  console.warn("[InvestmentReport Init] No valid proposal_id or spc_type_id on page load.");
}