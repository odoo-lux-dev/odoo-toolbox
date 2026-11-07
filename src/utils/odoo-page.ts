import type { OdooWebClient } from "@/types";

/**
 * Accessors for the Odoo web client of the current page (MAIN world only).
 */

/**
 * Turns `server_version_info` (e.g. `["saas~17", 2, ...]`) into a number such as `17.2`.
 */
export const parseOdooVersion = (serverVersionInfo: unknown): number | null => {
  if (!Array.isArray(serverVersionInfo)) return null;
  const version = Number(
    serverVersionInfo
      .slice(0, 2)
      .join(".")
      .replace(/^saas~/, "")
      .replace(/\.0$/, ""),
  );
  return Number.isNaN(version) ? null : version;
};

export const getOdooVersion = (odoo: OdooWebClient | undefined = window.odoo): number | null =>
  parseOdooVersion((odoo?.info ?? odoo?.session_info)?.server_version_info);

export const getCurrentController = () =>
  window.odoo?.__WOWL_DEBUG__?.root?.actionService?.currentController;

export const isOnSpecificRecordPage = (): boolean => {
  const controller = getCurrentController();
  const resId = controller?.props?.resId || controller?.getLocalState?.()?.resId;
  return !!resId && !!controller?.props?.resModel;
};

/** Odoo 17.2 replaced the `#model=...` hash URLs by `/odoo/...` paths. */
export const hasNewOdooURL = (): boolean => (getOdooVersion() ?? 0) >= 17.2;

export const isOnNewURLPos = (): boolean => {
  if (!hasNewOdooURL()) return false;
  const root = window.odoo?.__WOWL_DEBUG__?.root;
  return !!root && "pos" in root;
};
