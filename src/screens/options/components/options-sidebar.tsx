import {
  ArrowUpRight01Icon,
  Book02Icon,
  Bug01Icon,
  Idea01Icon,
  Settings02Icon,
  StarIcon,
  TranslateIcon,
} from "@hugeicons/core-free-icons";
import { For, Show } from "solid-js";

import { BrandLogo } from "@/components/shared/brand-logo";
import { CountPill } from "@/components/ui/chip";
import { cx } from "@/components/ui/cx";
import { HugeiconsIcon, type IconData } from "@/components/ui/hugeicons-icon";
import { useFavorites } from "@/hooks/use-favorites";
import { BackupControls } from "@/screens/options/backup";
import {
  activeSection,
  drawerOpen,
  route,
  scrollToSection,
  setDrawerOpen,
} from "@/screens/options/options-nav";
import { SETTINGS_SECTIONS } from "@/screens/options/sections";
import { t } from "@/services/i18n-service";
import { GITHUB_REPO_URL } from "@/utils/constants";

export const RESOURCES: { href: string; icon: IconData; label: () => string }[] = [
  {
    href: "https://odoo-lux-dev.github.io/odoo-toolbox/",
    icon: Book02Icon,
    label: () => t("options.sidebar.documentation"),
  },
  {
    href: `${GITHUB_REPO_URL}/issues/new?template=bug_report.yml`,
    icon: Bug01Icon,
    label: () => t("options.sidebar.report_bug"),
  },
  {
    href: `${GITHUB_REPO_URL}/issues/new?template=feature_request.yml`,
    icon: Idea01Icon,
    label: () => t("options.sidebar.suggest_feature"),
  },
  {
    href: `${GITHUB_REPO_URL}/issues/new?template=translation.yml`,
    icon: TranslateIcon,
    label: () => t("options.sidebar.improve_translation"),
  },
];

const NavItem = (props: {
  id: string;
  href: string;
  icon: IconData;
  label: string;
  active: boolean;
  count?: number;
}) => (
  <a
    id={props.id}
    href={props.href}
    aria-current={props.active ? "page" : undefined}
    class="ot-nav-item"
  >
    <span class="ot-nav-icon size-4.5">
      <HugeiconsIcon icon={props.icon} size={16} strokeWidth={1.8} />
    </span>
    <span class="ot-nav-label">{props.label}</span>
    <Show when={props.count !== undefined}>
      <CountPill
        tone={props.active ? "primary" : "neutral"}
        class={props.active ? "bg-primary-tint" : undefined}
      >
        {props.count}
      </CountPill>
    </Show>
  </a>
);

export const OptionsSidebar = () => {
  const extensionVersion = `v${browser.runtime.getManifest().version}`;
  const { favorites } = useFavorites();

  return (
    <aside
      id="options-sidebar"
      data-slot="options-sidebar"
      aria-label={t("options.shell.main_navigation")}
      class={cx(
        "flex h-screen w-options-sidebar flex-none flex-col border-e border-line bg-surface px-3 pt-3.5 pb-2.75",
        "max-lg:fixed max-lg:inset-y-0 max-lg:inset-s-0 max-lg:z-50 max-lg:shadow-pop max-lg:transition-transform max-lg:duration-200 max-lg:ease-theme",
        drawerOpen() ? "" : "max-lg:-translate-x-full max-lg:rtl:translate-x-full",
      )}
    >
      <a href="#/options" class="flex items-center gap-2.5 px-1.5 pt-0.5 pb-3.5">
        <BrandLogo size={34} class="ring-1 ring-line" />
        <span class="flex min-w-0 flex-col leading-tight">
          <strong class="font-display text-sm font-semibold tracking-tight">
            {t("options.sidebar.title")}
          </strong>
          <span class="mt-0.5 font-mono text-micro tracking-[0.08em] text-ink-3 uppercase rtl:font-sans rtl:tracking-normal">
            {t("options.shell.tagline")}
          </span>
        </span>
      </a>

      <div class="min-h-0 flex-1 overflow-y-auto pt-0.5 pb-2">
        <nav class="flex flex-col gap-px">
          <NavItem
            id="global-options"
            href="#/options"
            icon={Settings02Icon}
            label={t("options.shell.settings")}
            active={route() === "options"}
          />
          <div class="ms-4.5 mt-px mb-1.25 flex flex-col gap-px border-s border-line ps-2.5">
            <For each={SETTINGS_SECTIONS}>
              {(section) => {
                const active = () => route() === "options" && activeSection() === section.id;
                return (
                  <a
                    href={`#/options#${section.id}`}
                    aria-current={active() ? "location" : undefined}
                    class="ot-nav-subitem"
                    onClick={() => {
                      if (route() === "options") scrollToSection(section.id);
                      setDrawerOpen(false);
                    }}
                  >
                    {t(section.label)}
                  </a>
                );
              }}
            </For>
          </div>
          <NavItem
            id="sh-favorites"
            href="#/favorites"
            icon={StarIcon}
            label={t("options.shell.favorites")}
            active={route() === "favorites"}
            count={favorites().length}
          />
        </nav>
      </div>

      <div class="flex flex-col gap-2.5 border-t border-line pt-3">
        <BackupControls />
        <nav
          class="flex flex-col gap-px border-t border-line pt-2.5"
          aria-label={t("options.shell.resources")}
        >
          <p class="px-1 pb-1 font-mono text-caption font-medium tracking-[0.13em] text-ink-3 uppercase rtl:font-sans rtl:tracking-normal">
            {t("options.shell.resources")}
          </p>
          <For each={RESOURCES}>
            {(resource) => (
              <a href={resource.href} target="_blank" rel="noopener noreferrer" class="ot-nav-link">
                <span class="ot-nav-link-icon">
                  <HugeiconsIcon icon={resource.icon} size={13} strokeWidth={1.8} />
                </span>
                <span class="flex-1">{resource.label()}</span>
                <span class="ot-nav-external rtl:-scale-x-100">
                  <HugeiconsIcon icon={ArrowUpRight01Icon} size={11} strokeWidth={1.8} />
                </span>
              </a>
            )}
          </For>
        </nav>
        <div class="flex items-center justify-center gap-1.75 text-meta text-ink-3">
          <span id="extension-version" class="font-mono">
            {extensionVersion}
          </span>
          {/* Flag font (flag-emoji.css): Windows has no flag glyphs */}
          <span class="font-emoji text-sm leading-none" role="img" aria-label="Luxembourg">
            🇱🇺
          </span>
        </div>
      </div>
    </aside>
  );
};
