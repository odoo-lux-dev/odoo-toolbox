import { PaintBoardIcon, Tick02Icon } from "@hugeicons/core-free-icons";
import { For, onCleanup } from "solid-js";

import { cx } from "@/components/ui/cx";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { previewTheme, useActiveTheme } from "@/hooks/use-extension-theme";
import { useSettings } from "@/hooks/use-settings";
import {
  booleanSwitch,
  OptionCard,
  SwitchesCard,
  type SettingCard,
} from "@/screens/options/components/option-card";
import { SCROLL_CONTAINER_ID } from "@/screens/options/options-nav";
import { uiThemeLabel } from "@/screens/shared/appearance-commands";
import { t } from "@/services/i18n-service";
import { settingsService } from "@/services/settings-service";
import { daisyThemeName, UI_THEMES, type UiThemeId } from "@/theme/themes";

/**
 * Live sample of a UI theme: the element carries the theme attributes, so the
 * contract utilities inside render with that theme's tokens, fonts and radii.
 */
const ThemePreview = (props: { id: UiThemeId; scheme: "light" | "dark" }) => (
  <span
    data-ui-theme={props.id}
    data-theme={daisyThemeName(props.id, props.scheme)}
    data-color-scheme={props.scheme}
    class="pointer-events-none flex h-32 shrink-0 flex-col overflow-hidden rounded-field border border-line bg-canvas text-ink"
    aria-hidden="true"
  >
    <span class="flex items-center gap-1.5 bg-topbar px-2.5 py-1.5 text-topbar-content">
      <span class="size-2 rounded-full bg-topbar-content/80" />
      <span class="font-display text-ui font-semibold">Odoo Toolbox</span>
    </span>
    <span class="flex flex-col gap-1.5 p-2.5">
      <span class="ot-card flex-row items-center gap-2 px-2.5 py-2">
        <span class="ot-icon-tile font-display text-note font-bold">AS</span>
        <span class="flex min-w-0 flex-col">
          <span class="truncate text-body font-semibold">Acme · Staging</span>
          <span class="truncate font-mono text-meta text-ink-3">acme-staging</span>
        </span>
      </span>
      <span class="flex items-center gap-1.5">
        <span class="ot-chip" data-tone="primary" data-shape="pill">
          search_read
        </span>
        <span class="ot-chip" data-tone="accent" data-shape="pill">
          12
        </span>
      </span>
    </span>
  </span>
);

const HOVER_PREVIEW_DELAY_MS = 150;

/** UI theme picker: one tile per registered theme, previewed in the current scheme. */
const UiThemePicker = () => {
  const settings = useSettings();
  const activeTheme = useActiveTheme();

  let hovered: HTMLElement | undefined;
  let previewed: HTMLElement | undefined;
  let previewTimer: ReturnType<typeof setTimeout> | undefined;

  // A theme changes the layout (access enlarges everything): the page scrolls to keep the
  // previewed tile where it was, and only a real mouse movement may pick another tile, since
  // the browser also reports hover changes when the layout moves under a still pointer.
  const preview = (tile: HTMLElement | undefined) => {
    const anchor = tile ?? previewed;
    const top = anchor?.getBoundingClientRect().top ?? 0;
    previewed = tile;
    const id = tile?.dataset.themeChoice as UiThemeId | undefined;
    previewTheme(id && id !== settings().extensionUiTheme ? { extensionUiTheme: id } : undefined);
    if (anchor) {
      document
        .getElementById(SCROLL_CONTAINER_ID)
        ?.scrollBy(0, anchor.getBoundingClientRect().top - top);
    }
  };

  const onPointerMove = (event: PointerEvent) => {
    const moved = event.movementX !== 0 || event.movementY !== 0;
    if (event.pointerType !== "mouse" || !moved) return;
    const target = event.target as Element;
    const tile = target.closest<HTMLElement>("[data-theme-choice]") ?? undefined;
    if (tile === hovered) return;
    hovered = tile;
    clearTimeout(previewTimer);
    previewTimer = setTimeout(() => preview(tile), HOVER_PREVIEW_DELAY_MS);
  };
  document.addEventListener("pointermove", onPointerMove);
  onCleanup(() => {
    document.removeEventListener("pointermove", onPointerMove);
    clearTimeout(previewTimer);
    previewTheme(undefined);
  });

  return (
    <OptionCard
      card={UiThemeOption}
      icon={PaintBoardIcon}
      tone="primary"
      wide
      description={t("options.settings.ui_theme_desc")}
      keywords="theme appearance look style odoo native access accessibility console dense compact toybox playful rounded classic retro original"
    >
      <div
        role="radiogroup"
        aria-label={t("options.settings.ui_theme")}
        class="grid auto-rows-fr grid-cols-1 gap-2.5 sm:grid-cols-2"
      >
        <For each={Object.values(UI_THEMES)}>
          {(theme) => {
            const checked = () => settings().extensionUiTheme === theme.id;
            return (
              <label
                class="group relative block h-full cursor-pointer"
                data-theme-choice={theme.id}
              >
                <input
                  type="radio"
                  class="peer absolute size-px opacity-0"
                  name="ui-theme-choice"
                  value={theme.id}
                  checked={checked()}
                  onChange={() => settingsService.set("extensionUiTheme", theme.id)}
                />
                <span
                  class={cx(
                    "flex h-full flex-col gap-2.5 rounded-box border p-2.5 transition-colors duration-150 ease-theme peer-focus-visible:outline-(length:--ot-focus-width) peer-focus-visible:outline-offset-(--ot-focus-offset) peer-focus-visible:outline-accent peer-focus-visible:outline-solid",
                    checked()
                      ? "border-primary bg-primary-soft"
                      : "border-line bg-surface-2 group-hover:border-line-strong",
                  )}
                >
                  <ThemePreview id={theme.id} scheme={activeTheme().colorScheme} />
                  <span class="flex items-start justify-between gap-2">
                    <span class="flex flex-col gap-0.5">
                      <strong
                        class={cx(
                          "text-label font-semibold",
                          checked() ? "text-primary" : "text-ink",
                        )}
                      >
                        {uiThemeLabel(theme.id)}
                      </strong>
                      <span class="text-note/snug text-pretty text-ink-3">
                        {t(`options.settings.theme_${theme.id.replaceAll("-", "_")}_desc`)}
                      </span>
                    </span>
                    <span
                      class={cx(
                        "mt-0.5 text-primary transition-opacity duration-150",
                        checked() ? "opacity-100" : "opacity-0",
                      )}
                    >
                      <HugeiconsIcon icon={Tick02Icon} size={14} strokeWidth={2} />
                    </span>
                  </span>
                </span>
              </label>
            );
          }}
        </For>
      </div>
    </OptionCard>
  );
};

export const UiThemeOption: SettingCard = {
  id: "ui-theme",
  title: "options.settings.ui_theme",
  Component: UiThemePicker,
};

/** Accessibility preferences: they combine with any UI theme. */
export const AccessibilityOption: SettingCard = {
  id: "accessibility",
  title: "options.settings.accessibility",
  switches: [
    {
      key: "extensionTextSize",
      id: "large-text",
      label: "options.settings.large_text",
      on: "large",
      off: "standard",
    },
    {
      key: "extensionMotion",
      id: "reduce-motion",
      label: "options.settings.reduce_motion",
      on: "reduced",
      off: "system",
    },
    booleanSwitch("extensionColorSafe", "color-safe-palette", "options.settings.color_safe"),
  ],
  Component: () => (
    <SwitchesCard card={AccessibilityOption} description="options.settings.accessibility_desc" />
  ),
};
