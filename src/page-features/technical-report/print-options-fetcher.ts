import { Logger } from "@/services/logger";
import { getOdooContextFromWindow } from "@/services/owl-runtime";
import type { OrmReportRecord, PrintOptionsReturn } from "@/types";
import { getCurrentController, getOdooVersion, isOnSpecificRecordPage } from "@/utils/odoo-page";

import { buildPrintContext, resolveActiveCompanyIds } from "./print-options-context";

const getPrintOptionsList = async (): Promise<PrintOptionsReturn | undefined> => {
  if (!isOnSpecificRecordPage()) return;
  const odooVersion = getOdooVersion();
  if (!odooVersion) return;
  const isLegacy = odooVersion <= 16;
  const isVersion15 = odooVersion === 15;
  const preferCookie = odooVersion >= 19;

  const controller = getCurrentController();
  if (!controller) return;

  const recordLocalState = controller.getLocalState?.();
  const currentResModel = controller.props?.resModel;
  if (!currentResModel) return;

  const currentResId = isVersion15 ? recordLocalState?.currentId : recordLocalState?.resId;
  if (currentResId === undefined || currentResId === null) return;

  const root = window.odoo?.__WOWL_DEBUG__?.root;
  const orm = root?.env?.services?.orm;

  const userContext = await getOdooContextFromWindow(window.odoo).catch((error: unknown) => {
    Logger.warn("Could not read the user context, printing without it", error);
    return {};
  });
  const activeCompanyIds = resolveActiveCompanyIds({ root, preferCookie });

  const context = buildPrintContext({
    userContext,
    activeCompanyIds,
    currentResId,
    currentResModel,
  });

  let reports: OrmReportRecord[];

  try {
    if (isLegacy) {
      const rpc = window.odoo?.__DEBUG__?.services?.["web.rpc"];
      if (!rpc) return;

      reports = (await rpc.query({
        model: "ir.actions.report",
        method: "search_read",
        args: [[["model", "=", currentResModel]], ["display_name", "report_name"]],
        kwargs: {},
        context,
      })) as OrmReportRecord[];
    } else {
      if (!orm?.searchRead) return;

      reports = (await orm.searchRead(
        "ir.actions.report",
        [["model", "=", currentResModel]],
        ["display_name", "report_name"],
        { context },
      )) as OrmReportRecord[];
    }
  } catch {
    return;
  }

  return { reports, currentResId, currentResModel, context };
};

export { getPrintOptionsList };
