import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/globals.css";
import type { AppConfig } from "./config/app-config";

declare global {
  interface Window {
    /*
     * Used by local/dev integration and internally by React.
     */
    __APP_CONFIG__?: AppConfig;

    /*
     * This is the config name currently produced by
     * PLUGIN_LEASES_FIN_EVAL in APEX.
     */
    SPC_LEASES_CONFIG?: AppConfig;

    /*
     * Public API exposed to APEX.
     */
    InvestmentReportWidget?: {
      init: (hostId: string, config: AppConfig) => void;
      destroy: (hostId: string) => void;
    };

    /*
     * Mount record shared by every copy of this bundle.
     */
    __leasesImportInvestmentReportMount?: MountState;
  }
}

type MountState = {
  root:      ReturnType<typeof ReactDOM.createRoot> | null;
  container: HTMLElement | null;
  key:       string | null;
};

/*
 * Keep track of the React root so we do not create
 * multiple roots on the same DOM element.
 *
 * Kept on window (not module scope) so that if the APEX page loads this
 * bundle more than once, every copy sees the same mount and can't add a
 * second live widget. Named for Leases Import so it can't collide with the
 * other widgets that expose the same InvestmentReportWidget global.
 */
const mount: MountState = (window.__leasesImportInvestmentReportMount ??= { root: null, container: null, key: null });

/*
 * Identifies which proposal/file/template a mount is showing.
 */
const mountKey = (c: AppConfig): string =>
  `${c.proposal_id}|${c.file_id}|${c.spc_type_id}|${c.template_type_id}`;


/* ============================================================
   INIT
   ============================================================ */
function init(hostId: string, config: AppConfig): void {
  const container = document.getElementById(hostId);

  if (!container) {
    console.error(
      "[InvestmentReport] Mount container not found:",
      hostId
    );
    return;
  }

  if (!config) {
    console.error(
      "[InvestmentReport] init() called without config."
    );
    return;
  }

  console.log(
    "[InvestmentReport] init() called with:",
    {
      proposal_id: config?.proposal_id,
      file_id: config?.file_id,
      template_type_id: config?.template_type_id,
      spc_type_id: config?.spc_type_id,
    }
  );

  /*
   * Make the APEX config available to the rest of
   * the React application under the name it already
   * expects.
   */
  window.__APP_CONFIG__ = config;

  /*
   * init() runs on page load (auto-mount below) AND whenever APEX calls
   * InvestmentReportWidget.init. Same container + same proposal/file →
   * keep the live widget (remounting would repeat its GET / account-code
   * calls); anything else → unmount the old one before mounting fresh.
   */
  if (mount.root) {
    if (mount.container === container && container.isConnected && mount.key === mountKey(config)) {
      return;
    }

    console.log(
      "[InvestmentReport] Existing React root found. Unmounting first."
    );

    mount.root.unmount();
    mount.root = null;
    mount.container = null;
    mount.key = null;
  }

  /*
   * Clean up anything that might remain in the host.
   */
  container.innerHTML = "";

  /*
   * Create React root.
   */
  mount.root = ReactDOM.createRoot(container);
  mount.container = container;
  mount.key = mountKey(config);

  mount.root.render(
    // <React.StrictMode>
      <App />
    // </React.StrictMode>
  );

  console.log(
    "[InvestmentReport] Widget mounted successfully."
  );
}


/* ============================================================
   DESTROY
   ============================================================ */
function destroy(hostId: string): void {
  if (mount.root) {
    console.log(
      "[InvestmentReport] Unmounting React root from:",
      mount.container?.id ?? null
    );

    mount.root.unmount();
    mount.root = null;
    mount.container = null;
    mount.key = null;
  }

  const container = document.getElementById(hostId);

  if (container) {
    container.innerHTML = "";
  }
}


/* ============================================================
   EXPOSE API TO APEX
   ============================================================ */
window.InvestmentReportWidget = {
  init,
  destroy,
};


/* ============================================================
   GET CONFIG

   Local/dev:
       window.__APP_CONFIG__

   APEX Page 38:
       window.SPC_LEASES_CONFIG
   ============================================================ */
function getAppConfig(): AppConfig | undefined {
  return (
    window.__APP_CONFIG__ ??
    window.SPC_LEASES_CONFIG
  );
}


/* ============================================================
   AUTO MOUNT
   ============================================================ */
function autoMount(): void {
  const hostId = "leases-investment-report-root";

  /*
   * Do not auto-mount again if we already have
   * a React root.
   */
  if (mount.root) {
    console.log(
      "[InvestmentReport Init] Widget is already mounted. Skipping autoMount."
    );
    return;
  }

  /*
   * IMPORTANT:
   * Read the config at the time autoMount runs.
   *
   * Do NOT capture it once at module load because
   * APEX may create SPC_LEASES_CONFIG later.
   */
  const config = getAppConfig();

  console.log(
    "[InvestmentReport Init] Config at autoMount:",
    config
  );

  if (!config) {
    console.warn(
      "[InvestmentReport Init] No configuration available yet."
    );
    return;
  }

  /*
   * A valid screen can be opened using either:
   *
   * proposal_id
   * OR
   * spc_type_id
   *
   * For your current Page 38 case, proposal_id exists.
   */
  const hasValidId =
    config.proposal_id != null ||
    config.spc_type_id != null;

  if (!hasValidId) {
    console.warn(
      "[InvestmentReport Init] No valid proposal_id or spc_type_id.",
      {
        proposal_id: config.proposal_id,
        spc_type_id: config.spc_type_id,
      }
    );
    return;
  }

  const container = document.getElementById(hostId);

  if (!container) {
    console.warn(
      "[InvestmentReport Init] Host is not available yet:",
      hostId
    );
    return;
  }

  console.log(
    "[InvestmentReport Init] Automatically mounting widget.",
    {
      hostId,
      proposal_id: config.proposal_id,
      file_id: config.file_id,
      template_type_id: config.template_type_id,
      spc_type_id: config.spc_type_id,
    }
  );

  init(hostId, config);
}


/* ============================================================
   APEX / BROWSER STARTUP

   Try once immediately.

   If APEX has not created the config/host yet,
   try again at DOMContentLoaded and window.load.
   ============================================================ */

console.log(
  "[InvestmentReport Init] Module loaded."
);

console.log(
  "[InvestmentReport Init] __APP_CONFIG__ at module load:",
  window.__APP_CONFIG__
);

console.log(
  "[InvestmentReport Init] SPC_LEASES_CONFIG at module load:",
  window.SPC_LEASES_CONFIG
);


/*
 * First attempt.
 *
 * This may already work if APEX rendered its config
 * before pivot-table.js was loaded.
 */
autoMount();


/*
 * Second attempt after DOM is ready.
 */
if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    () => {
      console.log(
        "[InvestmentReport Init] DOMContentLoaded.",
        {
          __APP_CONFIG__: window.__APP_CONFIG__,
          SPC_LEASES_CONFIG:
            window.SPC_LEASES_CONFIG,
        }
      );

      autoMount();
    },
    { once: true }
  );
}


/*
 * Final attempt after everything on the page has loaded.
 *
 * This is likely the important one for the APEX page.
 */
if (document.readyState !== "complete") {
  window.addEventListener(
    "load",
    () => {
      console.log(
        "[InvestmentReport Init] Window load.",
        {
          __APP_CONFIG__: window.__APP_CONFIG__,
          SPC_LEASES_CONFIG:
            window.SPC_LEASES_CONFIG,
        }
      );

      autoMount();
    },
    { once: true }
  );
} else {
  /*
   * Script may have been loaded after window.load.
   */
  autoMount();
}