import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import { For, Show, type Component, type JSX } from "solid-js";

import { cx } from "@/components/ui/cx";
import { HugeiconsIcon, type IconData } from "@/components/ui/hugeicons-icon";
import { IconTile as BaseIconTile } from "@/components/ui/icon-tile";
import { Toggle } from "@/components/ui/toggle";
import { InfoTooltip } from "@/components/ui/tooltip";
import { useSettings } from "@/hooks/use-settings";
import { t } from "@/services/i18n-service";
import { settingsService } from "@/services/settings-service";
import type { BooleanSettingKey, SettingKey, StoredSettings } from "@/types";

export type OptionTone = "primary" | "accent" | "warning";

/**
 * A switch bound to a setting: `on`/`off` are the stored values of the two
 * positions (`true`/`false` for boolean settings). `label` is a translation key,
 * its description is `<label>_desc`.
 */
export type SettingSwitch = {
  [K in SettingKey]: {
    key: K;
    id: string;
    label: string;
    on: StoredSettings[K];
    off: StoredSettings[K];
  };
}[SettingKey];

export const booleanSwitch = (
  key: BooleanSettingKey,
  id: string,
  label: string,
): SettingSwitch => ({
  key,
  id,
  label,
  on: true,
  off: false,
});

/** A card of the settings page, also listed (with its switches) by the command palette. */
export interface SettingCard {
  id: string;
  /** Translation key of the title. */
  title: string;
  switches?: readonly SettingSwitch[];
  Component: Component;
}

/** Rounded icon tile used by section and option headers. */
export const IconTile = (props: { icon: IconData; tone?: OptionTone; size?: "md" | "lg" }) => (
  <BaseIconTile tone={props.tone} size={props.size}>
    <HugeiconsIcon icon={props.icon} size={props.size === "lg" ? 18 : 16} strokeWidth={1.8} />
  </BaseIconTile>
);

interface OptionCardProps {
  card: SettingCard;
  description?: JSX.Element;
  icon?: IconData;
  tone?: OptionTone;
  /** Help content behind the info button (long explanations, lists). */
  info?: JSX.Element;
  /** Control displayed at the end of the header (toggle, badge...). */
  action?: JSX.Element;
  /** Spans both columns of the option grid. */
  wide?: boolean;
  /** Extra words matched by the settings search. */
  keywords?: string;
  children?: JSX.Element;
}

export const OptionCard = (props: OptionCardProps) => (
  <article
    id={props.card.id}
    data-search-card
    data-search-keywords={props.keywords}
    data-hover=""
    class={cx("ot-card gap-3.5 p-3 sm:p-4.5", props.wide ? "md:col-span-2" : undefined)}
  >
    <header class="flex items-start gap-2.5">
      <Show when={props.icon}>{(icon) => <IconTile icon={icon()} tone={props.tone} />}</Show>
      <div class="min-w-0 flex-1">
        <h3 class="font-display text-title/tight font-semibold tracking-tight">
          {t(props.card.title)}
        </h3>
        <Show when={props.description}>
          <p class="mt-0.75 text-label/normal text-pretty text-ink-2">{props.description}</p>
        </Show>
      </div>
      <Show when={props.action || props.info}>
        <div class="flex flex-none items-center gap-1">
          <Show when={props.action}>
            <div class="mt-1">{props.action}</div>
          </Show>
          {/* Help always ends the header, whatever the control before it */}
          <Show when={props.info}>
            <InfoTooltip
              content={props.info}
              icon={
                <HugeiconsIcon
                  icon={InformationCircleIcon}
                  size={14}
                  strokeWidth={1.8}
                  aria-label={t("options.shell.more_info")}
                />
              }
            />
          </Show>
        </div>
      </Show>
    </header>
    {props.children}
  </article>
);

/**
 * Group of SettingRow under a card header: owns the separator from the header, so
 * rows never touch it whatever the card content above them.
 */
export const SettingRows = (props: { children: JSX.Element }) => (
  <div class="flex flex-col border-t border-line-soft pt-1.5">{props.children}</div>
);

/** Labelled row inside SettingRows (label at the start, control at the end). */
export const SettingRow = (props: { label: JSX.Element; children: JSX.Element; for?: string }) => (
  <div class="flex min-h-target items-center justify-between gap-3 border-line-soft py-1.5 not-first:border-t">
    <label for={props.for} class="text-xs font-medium text-ink-2">
      {props.label}
    </label>
    {props.children}
  </div>
);

/** Switch control of a setting. */
export const SettingToggle = (props: { setting: SettingSwitch; id?: string }) => {
  const settings = useSettings();
  return (
    <Toggle
      id={props.id}
      class="flex-none"
      aria-label={t(props.setting.label)}
      checked={settings()[props.setting.key] === props.setting.on}
      onCheckedChange={(checked) => {
        const { key, on, off } = props.setting;
        void settingsService.set(key, (checked ? on : off) as never);
      }}
    />
  );
};

/** Labelled switch row of a print-like card (label at the start, switch at the end). */
export const SettingToggleRow = (props: { setting: SettingSwitch }) => (
  <SettingRow label={t(props.setting.label)} for={props.setting.id}>
    <SettingToggle setting={props.setting} id={props.setting.id} />
  </SettingRow>
);

/**
 * Wide card grouping switches in a band of columns. The position of each item
 * among the visible ones (`data-first`, `data-col`, `data-row`) is set by the
 * settings search filter.
 */
export const SwitchesCard = (props: { card: SettingCard; description: string }) => (
  <article
    id={props.card.id}
    data-search-card
    data-hover=""
    class="ot-card gap-4 p-3 sm:p-4.5 md:col-span-2"
  >
    <header class="flex flex-col gap-1 border-b border-line-soft pb-3 md:flex-row md:items-baseline md:justify-between md:gap-6">
      <h3 class="font-display text-title font-semibold tracking-tight">{t(props.card.title)}</h3>
      <p class="text-note text-ink-3 md:text-end">{t(props.description)}</p>
    </header>
    <div class="grid grid-cols-1 md:grid-cols-2 md:gap-y-4">
      <For each={props.card.switches}>
        {(setting) => (
          <div
            id={setting.id}
            data-search-item
            class="flex items-start justify-between gap-3.5 border-line-soft py-3 max-md:data-[first=false]:border-t md:py-0.5 md:data-[col=0]:pe-4.5 md:data-[col=1]:border-s md:data-[col=1]:ps-4.5 md:data-[row=next]:border-t md:data-[row=next]:pt-4"
          >
            <label
              for={`${setting.id}-toggle`}
              class="flex min-w-0 cursor-pointer flex-col gap-0.5"
            >
              <span class="text-label font-semibold text-ink">{t(setting.label)}</span>
              <span class="text-note/snug text-pretty text-ink-3">
                {t(`${setting.label}_desc`)}
              </span>
            </label>
            <div class="mt-0.5">
              <SettingToggle setting={setting} id={`${setting.id}-toggle`} />
            </div>
          </div>
        )}
      </For>
    </div>
  </article>
);
