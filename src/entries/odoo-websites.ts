import { handleChatterToggle, restoreChatterCollapsed } from "@/page-features/chatter-collapse";
import { handleChatterResizer, restoreChatterWidth } from "@/page-features/chatter-resize";
import { setDebugMode } from "@/page-features/debug-mode";
import { setDefaultColorScheme } from "@/page-features/default-color-scheme";
import { hideCustomHomeMenuBackground } from "@/page-features/home-menu-background";
import { handleLoginButtons } from "@/page-features/login-buttons";
import { announceOdooVersion } from "@/page-features/odoo-version";
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
  handleChatterResizer(element);
  handleChatterToggle(element);
};

const enhanceVersion15And16 = (element: Element) => {
  void handleTechnicalReportsVersion15and16(element);
  handleChatterResizer(element);
  handleChatterToggle(element);
};

const observeOdooUi = () => {
  const odooVersion = getOdooVersion();
  if (!odooVersion || odooVersion <= 14) return;
  const enhance = odooVersion >= 17 ? enhanceVersion17AndAbove : enhanceVersion15And16;

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

  announceOdooVersion();
  observeOdooUi();
  restoreChatterWidth();
  restoreChatterCollapsed();
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
