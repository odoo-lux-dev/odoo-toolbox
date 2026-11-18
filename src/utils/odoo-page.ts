import type { OdooWebClient } from "@/types";

/**
 * Accessors for the Odoo web client of the current page (MAIN world only).
 */

const readVersionParts = (serverVersionInfo: unknown) => {
  if (!Array.isArray(serverVersionInfo)) return null;
  const [major, minor = 0] = serverVersionInfo;
  const majorNumber = Number(String(major).replace(/^saas~/, ""));
  const minorNumber = Number(minor);
  if (!Number.isInteger(majorNumber) || majorNumber <= 0) return null;
  if (!Number.isInteger(minorNumber) || minorNumber < 0) return null;
  return { major: majorNumber, minor: minorNumber };
};

/**
 * Turns `server_version_info` (e.g. `["saas~17", 2, ...]`) into a number such as `17.2`.
 */
export const parseOdooVersion = (serverVersionInfo: unknown): number | null => {
  const parts = readVersionParts(serverVersionInfo);
  return parts && Number(`${parts.major}.${parts.minor}`);
};

export const formatOdooVersionBadge = (serverVersionInfo: unknown): string | null => {
  const parts = readVersionParts(serverVersionInfo);
  if (!parts || parts.major > 99 || parts.minor > 99) return null;
  return `${parts.major}.${parts.minor}`;
};

export const getServerVersionInfo = (odoo: OdooWebClient | undefined = window.odoo) =>
  (odoo?.info ?? odoo?.session_info)?.server_version_info;

export const getOdooVersion = (odoo: OdooWebClient | undefined = window.odoo): number | null =>
  parseOdooVersion(getServerVersionInfo(odoo));

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
