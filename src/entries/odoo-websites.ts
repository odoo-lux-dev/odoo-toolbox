import { setDebugMode } from "@/page-features/debug-mode";
import { setDefaultColorScheme } from "@/page-features/default-color-scheme";
import { hideCustomHomeMenuBackground } from "@/page-features/home-menu-background";
import { handleLoginButtons } from "@/page-features/login-buttons";
import { handleOdooShLoginButton } from "@/page-features/odoosh-login";
import { handleRunbotAutoLogin } from "@/page-features/runbot-login";
import {
  handleTechnicalModelName,
  scheduleTechnicalModelNameInModals,
} from "@/page-features/technical-model-name";
import {
  handleTechnicalReportsVersion15and16,
  handleTechnicalReportsVersion17andAbove,
} from "@/page-features/technical-report/print-options-handler";
import { getOdooVersion } from "@/utils/odoo-page";

const enhanceVersion17AndAbove = (element: Element) => {
  handleTechnicalModelName(element);
  void handleTechnicalReportsVersion17andAbove(element);
};

/**
 * Enhances the Odoo UI as it renders: technical model names (17.0+) and technical print
 * options (above 14.0). Older versions are not supported.
 */
const observeOdooUi = () => {
  const odooVersion = getOdooVersion();
  if (!odooVersion || odooVersion <= 14) return;
  const enhance =
    odooVersion >= 17
      ? enhanceVersion17AndAbove
      : (element: Element) => void handleTechnicalReportsVersion15and16(element);

  const observer = new MutationObserver((mutations) => {
    let hasAddedElement = false;
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        hasAddedElement = true;
        enhance(node as Element);
      }
    }
    if (hasAddedElement && odooVersion >= 17) scheduleTechnicalModelNameInModals();
  });
  observer.observe(document.body, { childList: true, subtree: true });
};

export default defineUnlistedScript(async () => {
  const tabUrl = new URL(window.location.href);

  observeOdooUi();
  hideCustomHomeMenuBackground();
  handleLoginButtons();
  handleOdooShLoginButton();
  const runbotAutoLoginHandled = handleRunbotAutoLogin();

  // Let the Runbot auto-login drive the navigation (form submit, logout, ...).
  // Debug mode and color scheme will be applied on the next page, after login.
  if (runbotAutoLoginHandled) return;

  const [colorSchemeSettings, debugModeSettings] = await Promise.all([
    setDefaultColorScheme(),
    setDebugMode(tabUrl),
  ]);

  if (debugModeSettings.reload && debugModeSettings.url) {
    window.location.href = debugModeSettings.url;
  } else if (colorSchemeSettings.reload) {
    window.location.reload();
  }
});
