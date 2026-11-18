export type ActionIconVariant = "debug" | "assets";

/** `debugMode` is the page's `odoo.debug` value: "", "1", "assets", "assets,tests"... */
export const getActionIconVariant = (debugMode: string): ActionIconVariant | null => {
  if (!debugMode) return null;
  return debugMode.split(",").includes("assets") ? "assets" : "debug";
};
