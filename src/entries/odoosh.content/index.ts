import "./odoosh-style.scss";
import { handleProjectListPageFavorites } from "@/page-features/odoo-sh/handle-sh-favorites";
import { handleProjectPage } from "@/page-features/odoo-sh/handle-sh-project-page";
import { Logger } from "@/services/logger";

type PageType = "project" | "list";

let current: { type: PageType | null; dispose: (() => void) | null } = {
  type: null,
  dispose: null,
};

// Guards to prevents two handlers activating simultaneously
let navigationId = 0;

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
      current = { type: pageType, dispose: null };

      const routeId = ++navigationId;
      try {
        const dispose =
          pageType === "project"
            ? await handleProjectPage()
            : await handleProjectListPageFavorites();

        if (routeId !== navigationId) {
          dispose();
          return;
        }
        current.dispose = dispose;
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
