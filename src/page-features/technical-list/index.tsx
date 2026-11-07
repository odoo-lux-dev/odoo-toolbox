import { render } from "solid-js/web";

import { TechnicalSidebar } from "@/screens/technical-list/components/technical-sidebar";
import {
  installHighlightStyles,
  syncHighlightPalette,
} from "@/screens/technical-list/highlight-styles";
import { Logger } from "@/services/logger";
import { applyTheme, onSystemColorSchemeChange } from "@/theme/apply-theme";
import { readDatasetSettings } from "@/utils/settings-schema";

import technicalListStyles from "./technical-list.css?inline";

const HOST_ID = "x-odoo-technical-list-shadow-host";

/** The Sign document page is a full-page viewer where the panel gets in the way. */
const isSignDocumentPage = () => document.body.classList.contains("o_sign_document_body");

const PROPERTY_RULES_STYLE_ID = "x-odoo-technical-list-property-rules";

/**
 * `@property` rules are ignored inside shadow trees, so the Tailwind variables they
 * declare (`--tw-shadow`, `--tw-translate-x`, ...) would have no initial value and every
 * utility composing them (shadows, rings, translate, scale) would be dropped. Registering
 * them on the host document makes them available to the shadow root as well.
 */
const registerPropertyRules = (): void => {
  if (document.getElementById(PROPERTY_RULES_STYLE_ID)) return;
  const rules = technicalListStyles.match(/@property\s+--[\w-]+\s*\{[^}]*\}/g);
  if (!rules) return;
  const style = document.createElement("style");
  style.id = PROPERTY_RULES_STYLE_ID;
  style.textContent = rules.join("\n");
  document.head.appendChild(style);
};

const injectTechnicalListStyles = (root: ShadowRoot): void => {
  registerPropertyRules();
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(technicalListStyles);
  root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
};

/** Mounts the technical list (the content script injects this script only when it is enabled). */
export const initTechnicalList = (): void => {
  if (!window.odoo || isSignDocumentPage() || document.getElementById(HOST_ID)) return;
  try {
    const host = document.createElement("div");
    host.id = HOST_ID;
    document.body.appendChild(host);

    const shadowRoot = host.attachShadow({ mode: "open" });
    injectTechnicalListStyles(shadowRoot);

    const appRoot = document.createElement("div");
    appRoot.id = "x-odoo-technical-list-info-root";

    const settings = readDatasetSettings();
    const resolved = applyTheme(settings, appRoot);
    shadowRoot.appendChild(appRoot);
    // Host highlights live outside the shadow root: give them the theme accent.
    installHighlightStyles(appRoot);

    // "system" scheme: follow the OS while the page stays open.
    if (resolved.colorSchemePreference === "system") {
      onSystemColorSchemeChange(() => {
        applyTheme(settings, appRoot);
        syncHighlightPalette(appRoot);
      });
    }

    render(() => <TechnicalSidebar />, appRoot);
  } catch (error) {
    Logger.error("Failed to initialize the technical list:", error);
  }
};
