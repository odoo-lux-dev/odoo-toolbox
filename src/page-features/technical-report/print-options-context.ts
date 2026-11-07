import type { OdooWebClientRoot } from "@/types";
import { getCookie } from "@/utils/cookie-utils";

// Parses both `cids` formats: "1,2" (Odoo <= 17) and "2-1" (Odoo >= 18).
export const normalizeCompanyIds = (value: unknown): number[] => {
  const raw = typeof value === "string" ? value.split(/[,-]/) : Array.isArray(value) ? value : [];
  const ids = raw.map(Number).filter((id) => Number.isInteger(id) && id > 0);

  return [...new Set(ids)];
};

const firstCompanyIds = (...values: unknown[]): number[] => {
  for (const value of values) {
    const ids = normalizeCompanyIds(value);
    if (ids.length > 0) return ids;
  }
  return [];
};

const getCidsFromUrl = (): string | null =>
  new URLSearchParams(window.location.hash.replace(/^#/, "")).get("cids") ??
  new URLSearchParams(window.location.search).get("cids");

/**
 * Reads the companies currently active in the tab.
 *
 * Odoo keeps this list in the company service (Odoo 15-18) or in the `cids`
 * cookie (Odoo 19+).
 */
export const resolveActiveCompanyIds = ({
  root,
  cidsFromUrl = getCidsFromUrl(),
  cidsFromCookie = getCookie("cids"),
  preferCookie = false,
}: {
  root?: OdooWebClientRoot;
  cidsFromUrl?: string | null;
  cidsFromCookie?: string | null;
  preferCookie?: boolean;
} = {}): number[] => {
  const companyService = root?.env?.services?.company;
  const userContext = root?.env?.services?.user?.context ?? root?.user?.context;

  const activeCompanyIds = firstCompanyIds(
    // Odoo 15/16 expose `allowedCompanyIds`, Odoo 17/18 expose `activeCompanyIds`.
    companyService?.activeCompanyIds,
    companyService?.allowedCompanyIds,
    userContext?.allowed_company_ids,
    // Up to Odoo 18 the URL is the per-tab source (the company service reads
    // it before the cookie). From Odoo 19 the cookie is authoritative.
    preferCookie ? cidsFromCookie : cidsFromUrl,
    preferCookie ? cidsFromUrl : cidsFromCookie,
  );
  if (activeCompanyIds.length > 0) return activeCompanyIds;

  const currentCompanyId = companyService?.currentCompany?.id;
  return typeof currentCompanyId === "number" && currentCompanyId > 0 ? [currentCompanyId] : [];
};

/**
 * Builds the report context the same way Odoo does when printing a record:
 *
 * - `allowed_company_ids` keeps the active company selection and its order;
 * - `active_id`, `active_ids` and `active_model` are the keys added by
 *   `ir.actions.report.report_action()` for a single record;
 * - the resulting context is then URL-encoded like `getReportUrl()` does.
 *
 * Sources:
 * - `odoo/addons/base/models/ir_actions_report.py` (`report_action`)
 * - `addons/web/static/src/webclient/actions/reports/utils.js` (`getReportUrl`)
 */
export const buildPrintContext = ({
  userContext,
  activeCompanyIds,
  currentResId,
  currentResModel,
}: {
  userContext: Record<string, unknown>;
  activeCompanyIds: number[];
  currentResId: number;
  currentResModel: string;
}): Record<string, unknown> => {
  const context = { ...userContext };
  delete context.allowed_company_ids;

  if (activeCompanyIds.length > 0) {
    context.allowed_company_ids = activeCompanyIds;
  }

  context.active_id = currentResId;
  context.active_ids = [currentResId];
  context.active_model = currentResModel;

  return context;
};
