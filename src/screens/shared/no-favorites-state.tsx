import { ArrowUpRight01Icon, StarIcon } from "@hugeicons/core-free-icons";

import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { StateMessage } from "@/components/ui/status";
import { t } from "@/services/i18n-service";
import { ODOO_SH_PROJECTS_URL } from "@/utils/constants";

/** Empty favorites list: how to star a project, with a link to Odoo.sh. */
export const NoFavoritesState = (props: { framed?: boolean }) => (
  <StateMessage
    framed={props.framed}
    headingLevel={2}
    tone="primary"
    icon={<HugeiconsIcon icon={StarIcon} size={22} strokeWidth={1.8} />}
    title={t("common.no_favorites")}
    description={t("common.no_favorites_hint")}
    action={
      <a
        class="btn btn-primary btn-sm"
        href={ODOO_SH_PROJECTS_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        {t("common.take_me_to_sh")}
        <HugeiconsIcon
          icon={ArrowUpRight01Icon}
          size={14}
          strokeWidth={2}
          class="rtl:-scale-x-100"
        />
      </a>
    }
  />
);
