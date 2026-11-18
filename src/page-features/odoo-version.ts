import { ODOO_VERSION_EVENT } from "@/services/extension-messages";
import { getServerVersionInfo } from "@/utils/odoo-page";

const isOdooPage = () => window.odoo !== undefined || window.openerp !== undefined;

export const announceOdooVersion = () => {
  const serverVersionInfo = getServerVersionInfo();
  if (!serverVersionInfo && !isOdooPage()) return;
  // A string detail, as Firefox hides page-world objects from content scripts.
  const detail = serverVersionInfo ? JSON.stringify(serverVersionInfo) : null;
  document.dispatchEvent(new CustomEvent(ODOO_VERSION_EVENT, { detail }));
};
