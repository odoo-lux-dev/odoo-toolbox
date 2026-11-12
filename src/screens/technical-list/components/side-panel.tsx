import {
  AlertCircleIcon,
  Cancel01Icon,
  FilterIcon,
  InformationCircleIcon,
  InputShortTextIcon,
  MouseLeftClick06Icon,
  Search01Icon,
  Select02Icon,
  ZoomInAreaIcon,
} from "@hugeicons/core-free-icons";
import { For, Index, Match, Show, Switch, type JSX } from "solid-js";

import { Button, IconButton } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cx } from "@/components/ui/cx";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Input } from "@/components/ui/input";
import { StateMessage } from "@/components/ui/status";
import { getDir, t } from "@/utils/i18n-page";

import { PANEL_ATTRIBUTE, useSidebar } from "../sidebar-store";
import { ButtonItem } from "./button-item";
import { DatabaseInfoSection } from "./database-info";
import { FieldDetailsModal } from "./field-details-modal";
import { FieldItem } from "./field-item";
import { RecordInfoSection } from "./record-info";
import { WebsiteInfoSection } from "./website-info";

export const TECHNICAL_PANEL_ID = "x-odoo-technical-list-panel";
const PANEL_TITLE_ID = "x-odoo-technical-list-title";

const iconProps = { strokeWidth: 1.6 } as const;

const ErrorState = (props: { message: string; onRetry: () => void }) => (
  <StateMessage
    tone="error"
    icon={<HugeiconsIcon icon={AlertCircleIcon} size={20} {...iconProps} />}
    title={t("technical_list.states.error_title")}
    description={props.message}
    action={
      <Button color="primary" size="sm" class="text-xs" onClick={() => props.onRetry()}>
        {t("technical_list.states.retry")}
      </Button>
    }
  />
);

const FieldFilters = () => {
  const sidebar = useSidebar();
  const filters = sidebar.filters;
  const checks = () => [
    {
      label: t("technical_list.side_panel.required_only"),
      checked: filters().onlyRequired,
      onChange: (checked: boolean) => sidebar.setFilter("onlyRequired", checked),
    },
    {
      label: t("technical_list.side_panel.readonly_only"),
      checked: filters().onlyReadonly,
      onChange: (checked: boolean) => sidebar.setFilter("onlyReadonly", checked),
    },
    {
      label: t("technical_list.side_panel.fields_only"),
      checked: filters().kind === "fields",
      onChange: (checked: boolean) => sidebar.setFilter("kind", checked ? "fields" : "all"),
    },
    {
      label: t("technical_list.side_panel.buttons_only"),
      checked: filters().kind === "buttons",
      onChange: (checked: boolean) => sidebar.setFilter("kind", checked ? "buttons" : "all"),
    },
  ];
  const visibleCount = () => sidebar.filtered().fields.length + sidebar.filtered().buttons.length;

  return (
    <div class="ot-card bg-surface-2 px-3 py-2.5">
      <Input
        type="search"
        size="sm"
        placeholder={t("technical_list.side_panel.search_placeholder")}
        aria-label={t("technical_list.side_panel.search_placeholder")}
        value={filters().searchTerm}
        onInput={(event) =>
          sidebar.setFilter("searchTerm", (event.target as HTMLInputElement).value)
        }
        fullWidth
        class="h-control text-xs"
        affixStyle="plain"
        prefix={<HugeiconsIcon icon={Search01Icon} size={14} {...iconProps} />}
      />
      <div class="mt-2.5 grid grid-cols-2 gap-x-2 gap-y-1.5">
        <Index each={checks()}>
          {(check) => (
            <Checkbox
              checked={check().checked}
              onCheckedChange={check().onChange}
              label={<span class="text-xs text-ink-2">{check().label}</span>}
            />
          )}
        </Index>
      </div>
      <div class="mt-2.5 flex items-center justify-between gap-2 border-t border-solid border-line pt-2">
        {/* Always rendered: announces the result of the search and filters */}
        <span class="font-mono text-ui text-ink-3" aria-live="polite" aria-atomic="true">
          {t("technical_list.side_panel.visible_count", [visibleCount(), sidebar.elementCount()])}
        </span>
        <Button variant="link" size="xs" class="h-auto px-0 text-xs" onClick={sidebar.resetFilters}>
          {t("technical_list.side_panel.reset_filters")}
        </Button>
      </div>
    </div>
  );
};

const SidePanelHeader = () => {
  const sidebar = useSidebar();

  return (
    <header class="flex flex-none items-start justify-between gap-2.5 border-b border-solid border-line ps-4.5 pe-4 pt-3.5 pb-3">
      <div class="min-w-0">
        <span class="block font-mono text-small tracking-widest text-ink-3 uppercase">
          {t("technical_list.side_panel.title")}
        </span>
        <h2
          id={PANEL_TITLE_ID}
          class="m-0 mt-0.5 font-display text-lg/tight font-semibold tracking-tight text-ink"
        >
          {t("technical_list.floating_button.title")}
        </h2>
      </div>
      <div class="flex flex-none items-center gap-1">
        <Show when={sidebar.canSelect()}>
          <IconButton
            label={
              sidebar.isSelectionMode()
                ? t("technical_list.side_panel.exit_selection")
                : t("technical_list.side_panel.select_element")
            }
            variant={sidebar.isSelectionMode() ? "soft" : "ghost"}
            color={sidebar.isSelectionMode() ? "accent" : undefined}
            size="sm"
            circle={false}
            square
            aria-pressed={sidebar.isSelectionMode()}
            onClick={sidebar.toggleSelectionMode}
            class={sidebar.isSelectionMode() ? undefined : "text-ink-3"}
            icon={<HugeiconsIcon icon={Select02Icon} size={16} {...iconProps} />}
          />
        </Show>
        <IconButton
          label={t("technical_list.side_panel.close")}
          variant="ghost"
          size="sm"
          circle={false}
          square
          class="text-ink-3"
          onClick={sidebar.closePanel}
          icon={<HugeiconsIcon icon={Cancel01Icon} size={16} {...iconProps} />}
        />
      </div>
    </header>
  );
};

const SummaryHint = (props: { children: JSX.Element }) => (
  <span class="inline-flex items-center gap-1 rounded-sm border border-solid border-line bg-surface px-1.5 py-0.5 text-ui text-ink-3">
    <HugeiconsIcon icon={InformationCircleIcon} size={12} {...iconProps} class="text-accent" />
    {props.children}
  </span>
);

const SidePanelSummary = (props: { totalFields: number; totalButtons: number }) => {
  const sidebar = useSidebar();
  return (
    <div class="flex flex-none flex-wrap items-center gap-x-2 gap-y-1.5 border-b border-solid border-line bg-surface-2 px-4.5 py-2">
      <Show
        when={sidebar.isWebsite()}
        fallback={
          <>
            <span class="text-title font-medium text-ink">
              {props.totalFields} {t("technical_list.side_panel.fields_found")}
              <Show when={props.totalButtons > 0}>
                {" · "}
                {props.totalButtons} {t("technical_list.side_panel.buttons_found")}
              </Show>{" "}
              {t("technical_list.side_panel.found")}
            </span>
            <SummaryHint>{t("technical_list.side_panel.hover_hint")}</SummaryHint>
          </>
        }
      >
        <span class="text-title font-medium text-ink">
          {t("technical_list.side_panel.website_info")}
        </span>
        <SummaryHint>{t("technical_list.side_panel.click_to_copy")}</SummaryHint>
      </Show>
    </div>
  );
};

const ListSection = (props: {
  icon: JSX.Element;
  title: string;
  count: number;
  children: JSX.Element;
}) => (
  <section>
    <div class="mb-2 flex min-h-6.5 items-center gap-1.5 text-ink-3">
      {props.icon}
      <h3 class="m-0 font-mono text-ui font-medium tracking-widest text-ink-2 uppercase">
        {props.title}
      </h3>
      <span class="ms-auto rounded-full border border-solid border-line bg-surface-2 px-1.5 font-mono text-small text-ink-3">
        {props.count}
      </span>
    </div>
    <div class="flex flex-col gap-2">{props.children}</div>
  </section>
);

const PanelContent = () => {
  const sidebar = useSidebar();
  const fields = () => sidebar.filtered().fields;
  const buttons = () => sidebar.filtered().buttons;

  return (
    <>
      <Show when={!sidebar.isWebsite() && sidebar.dbInfo()}>
        {(db) => <DatabaseInfoSection dbInfo={db()} />}
      </Show>

      <Show
        when={sidebar.viewInfo()?.websiteInfo}
        fallback={
          <Show when={sidebar.viewInfo()?.currentModel}>
            {(model) => <RecordInfoSection model={model()} info={sidebar.viewInfo()!} />}
          </Show>
        }
      >
        {(websiteInfo) => <WebsiteInfoSection websiteInfo={websiteInfo()} />}
      </Show>

      <Switch>
        <Match when={sidebar.elementCount() === 0}>
          <Show when={!sidebar.isWebsite()}>
            <StateMessage
              icon={<HugeiconsIcon icon={InformationCircleIcon} size={20} {...iconProps} />}
              title={t("technical_list.side_panel.no_fields")}
              description={t("technical_list.states.empty_hint")}
            />
          </Show>
        </Match>
        <Match when={true}>
          <FieldFilters />
          <Show when={fields().length > 0}>
            <ListSection
              icon={<HugeiconsIcon icon={InputShortTextIcon} size={14} {...iconProps} />}
              title={t("technical_list.side_panel.fields_list")}
              count={fields().length}
            >
              <For each={fields()}>{(field) => <FieldItem field={field} />}</For>
            </ListSection>
          </Show>
          <Show when={buttons().length > 0}>
            <ListSection
              icon={<HugeiconsIcon icon={MouseLeftClick06Icon} size={14} {...iconProps} />}
              title={t("technical_list.side_panel.buttons_list")}
              count={buttons().length}
            >
              <For each={buttons()}>{(button) => <ButtonItem button={button} />}</For>
            </ListSection>
          </Show>
          <Show when={fields().length + buttons().length === 0}>
            <StateMessage
              icon={<HugeiconsIcon icon={FilterIcon} size={20} {...iconProps} />}
              title={t("technical_list.side_panel.no_match")}
              action={
                <Button size="sm" class="text-xs" onClick={sidebar.resetFilters}>
                  {t("technical_list.side_panel.reset_filters")}
                </Button>
              }
            />
          </Show>
        </Match>
      </Switch>
    </>
  );
};

const SelectionHeading = (props: { title: string }) => (
  <div class="mb-2.5 flex items-center gap-2 border-b border-solid border-line pb-2.5">
    <HugeiconsIcon icon={ZoomInAreaIcon} size={18} {...iconProps} class="text-accent" />
    <h3 class="m-0 font-display text-sm font-semibold tracking-tight text-ink">{props.title}</h3>
  </div>
);

const SelectionContent = () => {
  const sidebar = useSidebar();

  return (
    <Show
      when={sidebar.picked()}
      keyed
      fallback={
        <div class="rounded-box border border-dashed border-line-strong px-3.5 py-5 text-center">
          <HugeiconsIcon
            icon={Select02Icon}
            size={20}
            {...iconProps}
            class="mx-auto mb-2 text-accent"
          />
          <p class="m-0 text-xs text-ink-3">
            {t("technical_list.side_panel.click_element_detail")}
          </p>
        </div>
      }
    >
      {(value) =>
        "field" in value ? (
          <div>
            <SelectionHeading title={t("technical_list.side_panel.selected_field")} />
            <FieldItem field={value.field} selected />
          </div>
        ) : (
          <div>
            <SelectionHeading title={t("technical_list.side_panel.selected_button")} />
            <ButtonItem button={value.button} selected />
          </div>
        )
      }
    </Show>
  );
};

const statusDotClass = {
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-error",
} as const;

const SidePanelFooter = () => {
  const sidebar = useSidebar();
  const version = () => {
    const value = sidebar.dbInfo()?.version;
    return value ? `Odoo ${value}` : "";
  };

  const status = (): { tone: keyof typeof statusDotClass; label: string } => {
    if (sidebar.error()) return { tone: "error", label: t("technical_list.states.error_title") };
    if (sidebar.isWebsite()) {
      return { tone: "success", label: t("technical_list.website_info.title") };
    }
    if (sidebar.elementCount() === 0) {
      return { tone: "warning", label: t("technical_list.states.no_elements") };
    }
    return {
      tone: "success",
      label: t("technical_list.states.element_count", [sidebar.elementCount()]),
    };
  };

  return (
    <footer class="flex flex-none items-center justify-between gap-2.5 border-t border-solid border-line bg-surface-2 px-4 py-2 text-ui text-ink-3">
      <span class="min-w-0 truncate font-mono">{version()}</span>
      <span class="inline-flex flex-none items-center gap-1.5 font-mono" aria-live="polite">
        <span class={cx("size-1.5 rounded-full", statusDotClass[status().tone])} />
        {status().label}
      </span>
    </footer>
  );
};

export const SidePanel = () => {
  const sidebar = useSidebar();

  return (
    <aside
      id={TECHNICAL_PANEL_ID}
      role="dialog"
      aria-modal="false"
      aria-labelledby={PANEL_TITLE_ID}
      aria-hidden={!sidebar.isExpanded()}
      inert={!sidebar.isExpanded()}
      {...{ [PANEL_ATTRIBUTE]: "true" }}
      dir={getDir()}
      onMouseLeave={sidebar.clearHighlight}
      class={cx(
        "fixed top-0 z-1000 flex h-screen w-[400px] flex-col overflow-hidden bg-surface text-ink max-md:w-full",
        // Physical side: the panel position is a user setting, independent of the text direction.
        sidebar.position === "left" ? "left-0 border-r" : "right-0 border-l",
        "border-solid border-line shadow-overlay max-md:border-0 max-md:shadow-none",
        // Hidden once slid out (visibility switches at the end of the closing transition).
        "transition-[transform,visibility] duration-300 ease-theme",
        sidebar.isExpanded() ? "visible" : "invisible",
      )}
      style={{
        transform: sidebar.isExpanded()
          ? "translateX(0)"
          : sidebar.position === "left"
            ? "translateX(-102%)"
            : "translateX(102%)",
      }}
    >
      <SidePanelHeader />
      <Show when={!sidebar.isSelectionMode() && !sidebar.error() && sidebar.viewInfo()}>
        {(info) => (
          <SidePanelSummary
            totalFields={info().technicalFields.length}
            totalButtons={info().technicalButtons.length}
          />
        )}
      </Show>

      <div class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pt-3.5 pb-4.5 *:shrink-0">
        <Switch>
          <Match when={sidebar.error()}>
            {(error) => <ErrorState message={error()} onRetry={sidebar.refresh} />}
          </Match>
          <Match when={sidebar.isSelectionMode()}>
            <SelectionContent />
          </Match>
          <Match when={sidebar.viewInfo()}>
            <PanelContent />
          </Match>
        </Switch>
      </div>

      <SidePanelFooter />
      <FieldDetailsModal />
    </aside>
  );
};
