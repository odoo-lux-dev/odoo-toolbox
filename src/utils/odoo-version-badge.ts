export interface OdooVersionPageInfo {
  /** `server_version_info`, null on an Odoo page that does not expose it. */
  serverVersionInfo: unknown;
  /** The page's `odoo.debug`: "", "1", "assets", "assets,tests"... */
  debugMode: string;
}

export interface BadgeColors {
  background: string;
  text: string;
}

const DEFAULT_COLORS: BadgeColors = { background: "#ede4ea", text: "#714b67" };
const DEBUG_COLORS: BadgeColors = { background: "#f5c211", text: "#3d3000" };
const DEBUG_ASSETS_COLORS: BadgeColors = { background: "#c01c28", text: "#ffffff" };

export const getBadgeColors = (debugMode: string): BadgeColors => {
  if (!debugMode) return DEFAULT_COLORS;
  return debugMode.split(",").includes("assets") ? DEBUG_ASSETS_COLORS : DEBUG_COLORS;
};

export const parseOdooVersionPageInfo = (json: unknown): OdooVersionPageInfo | null => {
  if (typeof json !== "string") return null;
  try {
    const { serverVersionInfo = null, debugMode = "" } = JSON.parse(json) ?? {};
    return typeof debugMode === "string" ? { serverVersionInfo, debugMode } : null;
  } catch {
    return null;
  }
};
