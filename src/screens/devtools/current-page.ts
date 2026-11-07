import type { NotificationFunction, OdooPageInfo, RpcQueryState } from "@/types";
import { t } from "@/utils/i18n-page";

/** Turns the page shown in the inspected tab into rail values, or null when it shows no model. */
export const queryFromPage = (
  pageInfo: OdooPageInfo,
  notify?: NotificationFunction,
): Partial<RpcQueryState> | null => {
  if (!pageInfo.model) {
    notify?.(t("services.current_page.no_record"), "warning");
    return null;
  }

  if (pageInfo.recordIds && pageInfo.recordIds.length > 0) {
    notify?.(
      t("services.current_page.found_records", [
        String(pageInfo.recordIds.length),
        pageInfo.viewType || t("services.current_page.unknown_view"),
      ]),
      "success",
    );
    return { model: pageInfo.model, ids: pageInfo.recordIds.join(","), domain: "" };
  }

  if (pageInfo.domain) {
    notify?.(t("services.current_page.found_list", [pageInfo.model]), "success");
    return { model: pageInfo.model, ids: "", domain: JSON.stringify(pageInfo.domain) };
  }

  notify?.(t("services.current_page.found_model", [pageInfo.model]), "info");
  return { model: pageInfo.model, ids: "", domain: "" };
};
