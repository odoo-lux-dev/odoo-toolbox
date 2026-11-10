import { refreshActiveTabs } from "@/services/debug-mode-service";
import { settingsService } from "@/services/settings-service";
import { odooShProjectUrl } from "@/utils/constants";

/** Opens a favorite project in the current tab and closes the popup. */
export const openFavoriteInTab = (name: string) => {
  browser.tabs.update({ url: odooShProjectUrl(name) });
  window.close();
};

export const openFavoriteInNewTab = (name: string) => {
  browser.tabs.create({ url: odooShProjectUrl(name), active: false });
};

export const toggleTechnicalList = async () => {
  await settingsService.toggle("showTechnicalList");
  await refreshActiveTabs();
};
