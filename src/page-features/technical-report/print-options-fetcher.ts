import { OrmReportRecord, PrintOptionsReturn } from "@/types";
import { getOdooVersion, isOnSpecificRecordPage } from "@/utils/utils";

import {
  buildPrintContext,
  getUserContext,
  resolveActiveCompanyIds,
  type PrintRootLike,
} from "./print-options-context";

const getPrintOptionsList = async (): Promise<PrintOptionsReturn | undefined> => {
  if (!isOnSpecificRecordPage()) return;
  const odooVersion = getOdooVersion();
  if (!odooVersion) return;
  const isLegacy = parseFloat(odooVersion) <= 16;
  const isVersion15 = parseFloat(odooVersion) === 15;
  const preferCookie = parseFloat(odooVersion) >= 19;

  const controller = window.odoo?.__WOWL_DEBUG__?.root?.actionService?.currentController;
  if (!controller) return;

  const recordLocalState = controller.getLocalState?.();
  const currentResModel = controller.props?.resModel;
  if (!currentResModel) return;

  const currentResId = isVersion15 ? recordLocalState?.currentId : recordLocalState?.resId;
  if (currentResId === undefined || currentResId === null) return;

  const root = window.odoo?.__WOWL_DEBUG__?.root as unknown as PrintRootLike | undefined;
  const orm = root?.env?.services?.orm;

  const userContext = await getUserContext(root);
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
