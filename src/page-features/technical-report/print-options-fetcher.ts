import { OrmReportRecord, PrintOptionsReturn } from "@/types";
import { getOdooVersion, isOnSpecificRecordPage } from "@/utils/utils";

import { generatesCompaniesDomain } from "./companies-domain";

const getPrintOptionsList = async (): Promise<PrintOptionsReturn | undefined> => {
  if (!isOnSpecificRecordPage()) return;
  const odooVersion = getOdooVersion();
  if (!odooVersion) return;
  const isLegacy = parseFloat(odooVersion) <= 16;
  const isVersion15 = parseFloat(odooVersion) === 15;

  const controller = window.odoo?.__WOWL_DEBUG__?.root?.actionService?.currentController;
  if (!controller) return;

  const recordLocalState = controller.getLocalState?.();
  const currentResModel = controller.props?.resModel;
  if (!currentResModel) return;

  const currentResId = isVersion15 ? recordLocalState?.currentId : recordLocalState?.resId;
  if (currentResId === undefined || currentResId === null) return;

  const companiesDomain = generatesCompaniesDomain();

  let reports: OrmReportRecord[];
  let companies: { id: number }[];

  if (isLegacy) {
    const debugServices = window.odoo?.__DEBUG__?.services;
    if (!debugServices) return;

    const session = debugServices["@web/session"]?.session;
    const lang = session?.user_context?.lang;

    const context = { lang: lang ?? "en_US" };

    reports = (await debugServices["web.rpc"]?.query({
      model: "ir.actions.report",
      method: "search_read",
      args: [[["model", "=", currentResModel]], ["display_name", "report_name"]],
      kwargs: {},
      context,
    })) as OrmReportRecord[];

    companies = (await debugServices["web.rpc"]?.query({
      model: "res.company",
      method: "search_read",
      args: [companiesDomain, ["id"]],
      kwargs: {},
      context,
    })) as { id: number }[];
  } else {
    const orm = window.odoo?.__WOWL_DEBUG__?.root?.orm;
    if (!orm) return;

    reports = (await orm.searchRead(
      "ir.actions.report",
      [["model", "=", currentResModel]],
      ["display_name", "report_name"],
    )) as OrmReportRecord[];

    companies = (await orm.searchRead("res.company", companiesDomain, ["id"])) as { id: number }[];
  }

  const companyIds = companies.map((c) => c.id);

  return { reports, currentResId, currentResModel, companies: companyIds };
};

export { getPrintOptionsList };
