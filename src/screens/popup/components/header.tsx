import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";

import { BrandLogo } from "@/components/shared/brand-logo";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { t } from "@/services/i18n-service";
import { ODOO_SH_PROJECTS_URL } from "@/utils/constants";

export const Header = () => (
  <header
    data-slot="popup-header"
    class="flex min-h-14.5 flex-none items-center justify-between gap-2.5 border-b border-topbar-line bg-topbar ps-3.25 pe-3 text-topbar-content"
  >
    <div class="flex min-w-0 items-center gap-2.25">
      <BrandLogo size={30} class="ring-1 ring-topbar-line" />
      <div class="flex min-w-0 flex-col leading-tight">
        <strong class="truncate font-display text-title font-semibold tracking-[-0.01em]">
          Odoo Toolbox
        </strong>
        <span class="mt-0.5 font-mono text-micro font-medium tracking-[0.11em] text-topbar-muted uppercase">
          {t("popup.tagline")}
        </span>
      </div>
    </div>
    <a
      href={ODOO_SH_PROJECTS_URL}
      target="_blank"
      rel="noreferrer noopener"
      title={t("popup.open_sh")}
      class="inline-flex min-h-control-sm flex-none items-center gap-1 rounded-field border border-topbar-line bg-topbar-content/7 px-2 text-note font-semibold transition-colors duration-150 ease-theme hover:bg-topbar-content/14"
    >
      {t("popup.header_sh")}
      <HugeiconsIcon
        icon={ArrowUpRight01Icon}
        size={12}
        strokeWidth={2}
        class="opacity-70 rtl:-scale-x-100"
      />
    </a>
  </header>
);
