import { ODOO_VERSION_EVENT } from "@/services/extension-messages";
import { getServerVersionInfo } from "@/utils/odoo-page";
import type { OdooVersionPageInfo } from "@/utils/odoo-version-badge";

const isOdooPage = () => window.odoo !== undefined || window.openerp !== undefined;

export const announceOdooVersion = () => {
  const serverVersionInfo = getServerVersionInfo();
  if (!serverVersionInfo && !isOdooPage()) return;
  // A string detail, as Firefox hides page-world objects from content scripts.
  const pageInfo: OdooVersionPageInfo = {
    serverVersionInfo: serverVersionInfo ?? null,
    debugMode: window.odoo?.debug ?? "",
  };
  const detail = JSON.stringify(pageInfo);
  document.dispatchEvent(new CustomEvent(ODOO_VERSION_EVENT, { detail }));
};
