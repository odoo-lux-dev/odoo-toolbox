/** Odoo's py.js (vendored in src/utils/odoo-py_js/): only what the extension uses. */
declare module "@/utils/odoo-py_js/py.js" {
  export function evaluateExpr(expr: string, context?: Record<string, unknown>): unknown;
}
