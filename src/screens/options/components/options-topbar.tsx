import {
  ArrowRight01Icon,
  ComputerIcon,
  GithubIcon,
  Menu01Icon,
  Moon02Icon,
  Search01Icon,
  Sun03Icon,
} from "@hugeicons/core-free-icons";

import { CommandTrigger } from "@/components/ui/command-palette";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Kbd } from "@/components/ui/kbd";
import { Segmented } from "@/components/ui/segmented";
import { ToolButton } from "@/components/ui/tool-button";
import { useSettings } from "@/hooks/use-settings";
import { useSlashFocus } from "@/hooks/use-slash-focus";
import {
  activeSection,
  route,
  searchQuery,
  setDrawerOpen,
  setSearchQuery,
} from "@/screens/options/options-nav";
import { SETTINGS_SECTIONS } from "@/screens/options/sections";
import { t } from "@/services/i18n-service";
import { settingsService } from "@/services/settings-service";
import type { ColorSchemePreference } from "@/theme/themes";
import { GITHUB_REPO_URL } from "@/utils/constants";

import { LanguageSwitcher } from "./language-switcher";

const ThemeSwitch = () => {
  const settings = useSettings();
  return (
    <Segmented<ColorSchemePreference>
      ariaLabel={t("options.shell.theme")}
      iconOnly
      value={settings().extensionTheme}
      onChange={(value) => settingsService.set("extensionTheme", value)}
      items={[
        {
          value: "light",
          ariaLabel: t("options.shell.theme_light"),
          icon: <HugeiconsIcon icon={Sun03Icon} size={14} strokeWidth={1.8} />,
        },
        {
          value: "dark",
          ariaLabel: t("options.shell.theme_dark"),
          icon: <HugeiconsIcon icon={Moon02Icon} size={14} strokeWidth={1.8} />,
        },
        {
          value: "system",
          ariaLabel: t("options.shell.theme_system"),
          icon: <HugeiconsIcon icon={ComputerIcon} size={14} strokeWidth={1.8} />,
        },
      ]}
    />
  );
};

const GlobalSearch = () => {
  let inputRef: HTMLInputElement | undefined;

  useSlashFocus(() => inputRef);

  const placeholder = () =>
    route() === "favorites"
      ? t("options.search.favorites_placeholder")
      : t("options.search.settings_placeholder");

  return (
    <label class="group flex h-search w-65 items-center gap-1.75 rounded-field border border-line bg-surface px-2 transition-[border-color,box-shadow] duration-150 ease-theme focus-within:border-accent focus-within:ring-3 focus-within:ring-accent/20 max-xl:w-52 max-md:hidden">
      <span class="text-ink-3">
        <HugeiconsIcon icon={Search01Icon} size={14} strokeWidth={1.8} />
      </span>
      <input
        id="global-search"
        ref={(el) => (inputRef = el)}
        type="search"
        autocomplete="off"
        spellcheck={false}
        aria-label={placeholder()}
        placeholder={placeholder()}
        value={searchQuery()}
        onInput={(event) => setSearchQuery(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setSearchQuery("");
            inputRef?.blur();
          }
        }}
        class="min-w-0 flex-1 border-0 bg-transparent text-label text-ink outline-none placeholder:text-ink-3 [&::-webkit-search-cancel-button]:hidden"
      />
      <Kbd size="xs" class="group-focus-within:opacity-0">
        /
      </Kbd>
    </label>
  );
};

export const OptionsTopbar = (props: { onOpenCommands: () => void }) => {
  const crumbRoot = () =>
    route() === "favorites" ? t("options.shell.favorites") : t("options.shell.settings");
  const crumbCurrent = () => {
    if (route() === "favorites") return t("options.shell.projects");
    const section = SETTINGS_SECTIONS.find(({ id }) => id === activeSection());
    return section ? t(section.label) : "";
  };

  return (
    <header
      data-slot="options-topbar"
      class="z-20 flex min-h-13 flex-none items-center justify-between gap-4 border-b border-line bg-surface/80 px-3 backdrop-blur-md sm:min-h-14 sm:px-5 lg:px-6.5"
    >
      <div class="flex min-w-0 items-center gap-2.25">
        <ToolButton
          class="lg:hidden"
          label={t("options.shell.open_navigation")}
          aria-controls="options-sidebar"
          onClick={() => setDrawerOpen(true)}
          icon={<HugeiconsIcon icon={Menu01Icon} size={16} strokeWidth={1.8} />}
        />
        <nav
          class="flex min-w-0 items-center gap-1.5 text-note text-ink-3 sm:text-label"
          aria-label={t("options.shell.breadcrumb")}
        >
          <a
            href={route() === "favorites" ? "#/favorites" : "#/options"}
            class="truncate font-medium text-ink-2 hover:text-ink"
          >
            {crumbRoot()}
          </a>
          <span class="flex-none text-ink-4 rtl:-scale-x-100">
            <HugeiconsIcon icon={ArrowRight01Icon} size={12} strokeWidth={2} />
          </span>
          <span class="truncate font-semibold text-ink" aria-current="page">
            {crumbCurrent()}
          </span>
        </nav>
      </div>
      <div class="flex flex-none items-center gap-2.25">
        <GlobalSearch />
        <CommandTrigger
          label={t("commands.trigger")}
          onClick={props.onOpenCommands}
          class="max-sm:hidden"
        />
        <LanguageSwitcher />
        <ThemeSwitch />
        <a
          class="ot-tool max-md:hidden"
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          title={t("options.sidebar.github")}
          aria-label={t("options.sidebar.github")}
        >
          <HugeiconsIcon icon={GithubIcon} size={16} strokeWidth={1.8} />
        </a>
      </div>
    </header>
  );
};
