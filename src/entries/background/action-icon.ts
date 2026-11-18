import { getActionIconVariant } from "@/utils/action-icon";

const ICON_SIZES = [16, 32];

/**
 * Shows the debug mode of a tab's page on the toolbar icon. The browser drops a tab-specific
 * icon when the tab navigates, so a page without debug mode needs no reset.
 */
export const showDebugModeOnActionIcon = async (tabId: number, debugMode: string) => {
  const variant = getActionIconVariant(debugMode);
  const path = variant
    ? Object.fromEntries(ICON_SIZES.map((size) => [size, `/action-icons/${variant}-${size}.png`]))
    : browser.runtime.getManifest().icons;
  if (!path) return;

  // Manifest V2 (Firefox) only has `browserAction`.
  const action = browser.action ?? browser.browserAction;
  // The tab may be closed by now.
  await action.setIcon({ tabId, path }).catch(() => undefined);
};
