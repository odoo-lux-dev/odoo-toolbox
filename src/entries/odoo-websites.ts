import { setDebugMode } from "@/page-features/debug-mode";
import { setDefaultColorScheme } from "@/page-features/default-color-scheme";
import { handleLoginButtons } from "@/page-features/login-buttons";
import { initTechnicalList } from "@/page-features/technical-list";
import { handleTechnicalModelName } from "@/page-features/technical-model-name";
import {
  handleTechnicalReportsVersion15and16,
  handleTechnicalReportsVersion17andAbove,
} from "@/page-features/technical-report/print-options-handler";
import { getOdooVersion } from "@/utils/utils";

const handleVersion17AndAbove = async (targetNode: Element) => {
  handleTechnicalModelName(targetNode);
  await handleTechnicalReportsVersion17andAbove(targetNode);
};

const handleVersion15and16 = async (targetNode: Element) => {
  await handleTechnicalReportsVersion15and16(targetNode);
};

const observeMenuOpening = () => {
  /**
   * Monitors DOM changes to apply version-specific Odoo enhancements.
   * Sets up a MutationObserver that detects new elements and applies:
   * - For v17.0+: Technical model names and report options
   * - For v15.0/16.0: Technical report options only
   * - For v14.0 and below: No features (early return)
   */
  const odooVersion = getOdooVersion();
  if (!odooVersion || parseFloat(odooVersion) <= 14.0) return;

  const targetNode = document.querySelector("body");
  const config = { attributes: false, childList: true, subtree: true };
  if (!targetNode) return;

  const callback: MutationCallback = (mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(async (node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (parseFloat(odooVersion) >= 17.0) await handleVersion17AndAbove(node as Element);
            else await handleVersion15and16(node as Element);
          }
        });
      }
    }
  };

  const observer = new MutationObserver(callback);
  observer.observe(targetNode, config);
};

export default defineUnlistedScript(async () => {
  const tabUrl = new URL(window.location.href);

  observeMenuOpening();
  handleLoginButtons();

  const [colorSchemeSettings, debugModeSettings] = await Promise.all([
    setDefaultColorScheme(),
    setDebugMode(tabUrl),
  ]);

  if (debugModeSettings.reload && debugModeSettings.url) {
    window.location.href = debugModeSettings.url;
  } else if (colorSchemeSettings.reload) {
    window.location.reload();
  }

  initTechnicalList();
});
