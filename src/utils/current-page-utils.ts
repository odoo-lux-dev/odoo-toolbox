import type { GetCurrentPageResult, NotificationFunction, PageInfo, RpcQueryState } from "@/types";
import { t } from "@/utils/i18n-page";
import { calculateQueryValidity } from "@/utils/query-validation";

/**
 * Utility function to process current page information
 * and generate appropriate updates for RPC state
 */
export const processCurrentPageInfo = (
  pageInfo: PageInfo,
  showNotification?: NotificationFunction,
): GetCurrentPageResult | null => {
  if (!pageInfo.model) {
    // No record found
    showNotification?.(t("services.current_page.no_record"), "warning");
    return null;
  }

  // Apply retrieved information
  const updates: Partial<RpcQueryState> = {
    model: pageInfo.model,
  };

  if (pageInfo.recordIds && pageInfo.recordIds.length > 0) {
    updates.ids = pageInfo.recordIds.join(",");
    updates.domain = "";

    const recordCount = pageInfo.recordIds.length;
    showNotification?.(
      t("services.current_page.found_records", [
        String(recordCount),
        pageInfo.viewType || t("services.current_page.unknown_view"),
      ]),
      "success",
    );
  } else if (pageInfo.domain) {
    updates.domain = JSON.stringify(pageInfo.domain);
    updates.ids = "";

    showNotification?.(t("services.current_page.found_list", [pageInfo.model]), "success");
  } else {
    updates.ids = "";
    updates.domain = "";

    showNotification?.(t("services.current_page.found_model", [pageInfo.model]), "info");
  }

  // Calculate validity using updates with default values
  const isValid = calculateQueryValidity({
    ...updates,
    limit: 80,
    offset: 0,
  });

  updates.isQueryValid = isValid;

  return { pageInfo, updates };
};

/**
 * Async utility function to retrieve and process current Odoo page information
 */
export const getCurrentPageAndProcess = async (
  getCurrentPageInfo: () => Promise<PageInfo>,
  showNotification?: NotificationFunction,
): Promise<GetCurrentPageResult | null> => {
  try {
    const pageInfo = await getCurrentPageInfo();
    return processCurrentPageInfo(pageInfo, showNotification);
  } catch {
    showNotification?.(t("services.current_page.failed"), "error");
    return null;
  }
};
