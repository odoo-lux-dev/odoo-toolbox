import "./odoosh-style.scss";
import { handleShDownloadFullLog } from "@/page-features/odoo-sh/handle-sh-download-full-log";
import { handleProjectListPageFavorites } from "@/page-features/odoo-sh/handle-sh-favorites";
import { handleProjectPage } from "@/page-features/odoo-sh/handle-sh-project-page";
import { Logger } from "@/services/logger";
import { settingsService } from "@/services/settings-service";

type PageType = "project" | "list";

let current: {
  type: PageType | null;
  dispose: (() => void) | null;
  downloadLogDispose: (() => void) | null;
} = {
  type: null,
  dispose: null,
  downloadLogDispose: null,
};

// Guards to prevents two handlers activating simultaneously
let navigationId = 0;

const initShDownloadFullLog = async (): Promise<() => void> => {
  const settings = await settingsService.getSettings();
  return settings.downloadFullLog ? handleShDownloadFullLog() : () => {};
};

export default defineContentScript({
  matches: ["https://*.odoo.sh/project*"],
  main() {
    const getPageType = (): PageType =>
      window.location.href.startsWith("https://www.odoo.sh/project/") ? "project" : "list";

    const initOdooSh = async () => {
      const pageType = getPageType();
      if (pageType === current.type) return;

      // Stop the previous handler's observer before switching routes.
      current.dispose?.();
      current.downloadLogDispose?.();
      current = { type: pageType, dispose: null, downloadLogDispose: null };

      const routeId = ++navigationId;
      try {
        const [dispose, downloadLogDispose] = await Promise.all([
          pageType === "project" ? handleProjectPage() : handleProjectListPageFavorites(),
          initShDownloadFullLog(),
        ]);

        if (routeId !== navigationId) {
          dispose();
          downloadLogDispose();
          return;
        }
        current.dispose = dispose;
        current.downloadLogDispose = downloadLogDispose;
      } catch (error) {
        if (routeId === navigationId) current.type = null;
        Logger.error("An error occured while initialising Odoo.SH logic", error);
      }
    };

    browser.runtime.onMessage.addListener((message) => {
      if (message?.type === "odoosh:route-changed") {
        initOdooSh();
      }
    });

    initOdooSh();
  },
});
