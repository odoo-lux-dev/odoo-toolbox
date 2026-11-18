import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";

import { BrandLogo } from "@/components/shared/brand-logo";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { t } from "@/services/i18n-service";
import { ODOO_SH_PROJECTS_URL, RUNBOT_URL } from "@/utils/constants";

const ExternalLink = (props: { href: string; title: string; label: string }) => (
  <a
    href={props.href}
    target="_blank"
    rel="noreferrer noopener"
    title={props.title}
    class="inline-flex min-h-control-sm flex-none items-center gap-1 rounded-field border border-topbar-line bg-topbar-content/7 px-2 text-note font-semibold transition-colors duration-150 ease-theme hover:bg-topbar-content/14"
  >
    {props.label}
    <HugeiconsIcon
      icon={ArrowUpRight01Icon}
      size={12}
      strokeWidth={2}
      class="opacity-70 rtl:-scale-x-100"
    />
  </a>
);

export const Header = () => (
  <header
    data-slot="popup-header"
    class="flex min-h-14.5 flex-none items-center justify-between gap-2.5 border-b border-topbar-line bg-topbar ps-3.25 pe-3 text-topbar-content"
  >
    <div class="flex min-w-0 items-center gap-2.25">
      <BrandLogo size={30} class="ring-1 ring-topbar-line" />
      <strong class="ot-cap-line font-display text-title/tight font-semibold tracking-[-0.01em]">
        Odoo Toolbox
      </strong>
    </div>
    <div class="flex flex-none items-center gap-1.5">
      <ExternalLink
        href={RUNBOT_URL}
        title={t("popup.open_runbot")}
        label={t("popup.header_runbot")}
      />
      <ExternalLink
        href={ODOO_SH_PROJECTS_URL}
        title={t("popup.open_sh")}
        label={t("popup.header_sh")}
      />
    </div>
  </header>
);
