import "./odoosh-style.scss"

import { handleProjectPage } from "@/features/odoo-sh/handle-sh-project-page"
import { handleProjectListPageFavorites } from "@/features/odoo-sh/handle-sh-favorites"
import { Logger } from "@/utils/logger"

export default defineContentScript({
  matches: ["https://*.odoo.sh/project*"],
  main() {
    const initOdooSh = async () => {
      if (window.location.href.startsWith("https://www.odoo.sh/project/")) {
        return handleProjectPage()
      } else {
        return handleProjectListPageFavorites()
      }
    }

    initOdooSh().catch((error) =>
      Logger.error("An error occured while initialising Odoo.SH logic", error)
    )
  },
})
