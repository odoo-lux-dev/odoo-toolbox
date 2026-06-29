import {
  ArrowUpRight01Icon,
  Bug01Icon,
  GithubIcon,
  Idea01Icon,
  Settings02Icon,
  StarIcon,
  Book02Icon,
  TranslateIcon,
} from "@hugeicons/core-free-icons";
import { createSignal, onCleanup } from "solid-js";

import { LuxembourgFlag } from "@/components/shared/luxembourg-flag";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { ThemeController } from "@/components/ui/theme-controller";
import { BackupControls } from "@/screens/options/backup";
import { LanguageSwitcher } from "@/screens/options/components/language-switcher";
import { t } from "@/services/i18n-service";

export const OptionsSidebar = () => {
  const [extensionVersion] = createSignal(`v${browser.runtime.getManifest().version}`);
  const getRoute = () => {
    const raw = window.location.hash.slice(1).replace(/^\//, "");
    return raw.split("#")[0] || "home";
  };
  const [route, setRoute] = createSignal(getRoute());
  const handler = () => setRoute(getRoute());
  window.addEventListener("hashchange", handler);
  onCleanup(() => window.removeEventListener("hashchange", handler));

  return (
    <div class="flex min-h-screen w-72 flex-col gap-6 bg-base-100 p-4">
      <div class="relative flex items-center justify-center">
        <div class="absolute inset-s-0">
          <LanguageSwitcher />
        </div>
        <h1 class="text-center text-xl font-semibold text-primary dark:text-accent">
          {t("options.sidebar.title")}
        </h1>
        <div class="absolute inset-e-0">
          <ThemeController iconSize={18} />
        </div>
      </div>
      <div class="flex flex-col gap-2">
        <details class="collapse-arrow collapse bg-base-100" open={route() === "options"}>
          <summary class="collapse-title p-0">
            <a
              id="global-options"
              class={`btn w-full justify-start btn-ghost ${route() === "options" ? "btn-active" : ""}`}
              href="#/options"
            >
              <HugeiconsIcon icon={Settings02Icon} size={18} color="#2ebcfa" strokeWidth={2} />
              {t("options.sidebar.options")}
            </a>
          </summary>
          <div class="collapse-content flex flex-col gap-1 ps-8 pt-1">
            <a class="btn justify-start btn-ghost btn-sm" href="#/options#odoo-options">
              {t("options.sidebar.odoo")}
            </a>
            <a class="btn justify-start btn-ghost btn-sm" href="#/options#odoosh-options">
              {t("options.sidebar.odoo_sh")}
            </a>
          </div>
        </details>
        <a
          id="sh-favorites"
          class={`btn justify-start btn-ghost ${route() === "favorites" ? "btn-active" : ""}`}
          href="#/favorites"
        >
          <HugeiconsIcon icon={StarIcon} size={18} color="#ED8A19" strokeWidth={2} />
          {t("options.sidebar.sh_favorites")}
        </a>
      </div>
      <div class="mt-auto flex flex-col items-center gap-4">
        <BackupControls />
        <div class="flex w-full flex-col">
          <a
            href="https://odoo-lux-dev.github.io/odoo-toolbox/"
            target="_blank"
            rel="noopener noreferrer"
            class="group flex items-center justify-between rounded-sm p-2 text-sm text-base-content/60 hover:bg-base-200 hover:text-base-content"
          >
            <div class="flex items-center gap-2">
              <HugeiconsIcon icon={Book02Icon} size={16} color="currentColor" strokeWidth={2} />
              <span>{t("options.sidebar.documentation")}</span>
            </div>
            <span class="transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
              <HugeiconsIcon
                icon={ArrowUpRight01Icon}
                size={14}
                color="currentColor"
                strokeWidth={2}
              />
            </span>
          </a>
          <a
            href="https://github.com/odoo-lux-dev/odoo-toolbox/issues/new?template=bug_report.yml"
            target="_blank"
            rel="noopener noreferrer"
            class="group flex items-center justify-between rounded-sm p-2 text-sm text-base-content/60 hover:bg-base-200 hover:text-base-content"
          >
            <div class="flex items-center gap-2">
              <HugeiconsIcon icon={Bug01Icon} size={16} color="currentColor" strokeWidth={2} />
              <span>{t("options.sidebar.report_bug")}</span>
            </div>
            <span class="transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
              <HugeiconsIcon
                icon={ArrowUpRight01Icon}
                size={14}
                color="currentColor"
                strokeWidth={2}
              />
            </span>
          </a>
          <a
            href="https://github.com/odoo-lux-dev/odoo-toolbox/issues/new?template=feature_request.yml"
            target="_blank"
            rel="noopener noreferrer"
            class="group flex items-center justify-between rounded-sm p-2 text-sm text-base-content/60 hover:bg-base-200 hover:text-base-content"
          >
            <div class="flex items-center gap-2">
              <HugeiconsIcon icon={Idea01Icon} size={16} color="currentColor" strokeWidth={2} />
              <span>{t("options.sidebar.suggest_feature")}</span>
            </div>
            <span class="transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
              <HugeiconsIcon
                icon={ArrowUpRight01Icon}
                size={14}
                color="currentColor"
                strokeWidth={2}
              />
            </span>
          </a>
          <a
            href="https://github.com/odoo-lux-dev/odoo-toolbox/issues/new?template=translation.yml"
            target="_blank"
            rel="noopener noreferrer"
            class="group flex items-center justify-between rounded-sm p-2 text-sm text-base-content/60 hover:bg-base-200 hover:text-base-content"
          >
            <div class="flex items-center gap-2">
              <HugeiconsIcon icon={TranslateIcon} size={16} color="currentColor" strokeWidth={2} />
              <span>{t("options.sidebar.improve_translation")}</span>
            </div>
            <span class="transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
              <HugeiconsIcon
                icon={ArrowUpRight01Icon}
                size={14}
                color="currentColor"
                strokeWidth={2}
              />
            </span>
          </a>
        </div>
        <div class="flex items-center gap-2 text-xs">
          <a
            href="https://github.com/odoo-lux-dev/odoo-toolbox"
            target="_blank"
            rel="noopener noreferrer"
            title={t("options.sidebar.github")}
          >
            <HugeiconsIcon icon={GithubIcon} size={16} color="currentColor" strokeWidth={2} />
          </a>
          <span id="extension-version">{extensionVersion()}</span>
          <LuxembourgFlag />
        </div>
      </div>
    </div>
  );
};
