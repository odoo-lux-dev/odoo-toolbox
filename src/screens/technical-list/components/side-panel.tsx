import {
  Cancel01Icon,
  FilterIcon,
  InformationCircleIcon,
  InputShortTextIcon,
  MouseLeftClick06Icon,
  Search01Icon,
  Select02Icon,
  ZoomInAreaIcon,
} from "@hugeicons/core-free-icons";
import { For, Show, createMemo, splitProps, type JSX } from "solid-js";

import { IconButton } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Input } from "@/components/ui/input";
import { ButtonItem } from "@/screens/technical-list/components/button-item";
import { DatabaseInfoComponent } from "@/screens/technical-list/components/database-info";
import { FieldItem } from "@/screens/technical-list/components/field-item";
import { useTechnicalSidebar } from "@/screens/technical-list/components/hooks";
import { RecordInfo } from "@/screens/technical-list/components/record-info";
import { EmptyState, ErrorState, LoadingState } from "@/screens/technical-list/components/states";
import { WebsiteInfo } from "@/screens/technical-list/components/website-info";
import { useTechnicalListFilters } from "@/screens/technical-list/technical-list-signals";
import { getDir, t } from "@/utils/i18n-page";
import { getTechnicalListPosition } from "@/utils/utils";

interface FieldFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  showOnlyRequired: boolean;
  onRequiredChange: (show: boolean) => void;
  showOnlyReadonly: boolean;
  onReadonlyChange: (show: boolean) => void;
  showOnlyFields: boolean;
  onFieldsChange: (show: boolean) => void;
  showOnlyButtons: boolean;
  onButtonsChange: (show: boolean) => void;
}

const FieldFilters = (props: FieldFiltersProps) => {
  const [local] = splitProps(props, [
    "searchTerm",
    "onSearchChange",
    "showOnlyRequired",
    "onRequiredChange",
    "showOnlyReadonly",
    "onReadonlyChange",
    "showOnlyFields",
    "onFieldsChange",
    "showOnlyButtons",
    "onButtonsChange",
  ]);

  return (
    <div class="border-b border-solid border-base-200 px-6 py-4">
      <div>
        <Input
          type="text"
          size="sm"
          placeholder={t("technical_list.side_panel.search_placeholder")}
          value={local.searchTerm}
          onInput={(event) => local.onSearchChange((event.target as HTMLInputElement).value)}
          fullWidth
          class="input-bordered text-xs"
          suffix={
            <HugeiconsIcon
              icon={Search01Icon}
              size={16}
              color="currentColor"
              strokeWidth={1.6}
              class="text-base-content/50"
            />
          }
        />
      </div>
      <div class="mt-4 grid grid-cols-1 gap-3 text-sm text-base-content/80 sm:grid-cols-2">
        <div class="space-y-2">
          <div>
            <Checkbox
              checked={local.showOnlyRequired}
              onCheckedChange={local.onRequiredChange}
              label={t("technical_list.side_panel.required_only")}
              size="xs"
            />
          </div>
          <div>
            <Checkbox
              checked={local.showOnlyReadonly}
              onCheckedChange={local.onReadonlyChange}
              label={t("technical_list.side_panel.readonly_only")}
              size="xs"
            />
          </div>
        </div>
        <div class="space-y-2">
          <div>
            <Checkbox
              checked={local.showOnlyFields}
              onCheckedChange={local.onFieldsChange}
              label={t("technical_list.side_panel.fields_only")}
              size="xs"
            />
          </div>
          <div>
            <Checkbox
              checked={local.showOnlyButtons}
              onCheckedChange={local.onButtonsChange}
              label={t("technical_list.side_panel.buttons_only")}
              size="xs"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const SidePanelHeader = () => {
  const { isWebsite, isSelectionMode, hasFields, toggleSelectionMode, handleClose } =
    useTechnicalSidebar();

  return (
    <div class="flex items-center justify-between border-b border-solid border-base-200 px-6 py-4">
      <h3 class="text-lg font-semibold text-base-content">
        {t("technical_list.side_panel.title")}
      </h3>
      <div class="flex items-center gap-2">
        <Show when={!isWebsite() && hasFields()}>
          <IconButton
            label={
              isSelectionMode()
                ? t("technical_list.side_panel.exit_selection")
                : t("technical_list.side_panel.select_element")
            }
            variant="ghost"
            size="sm"
            active={isSelectionMode()}
            onClick={toggleSelectionMode}
            icon={
              <HugeiconsIcon icon={Select02Icon} size={16} color="currentColor" strokeWidth={1.6} />
            }
            class={isSelectionMode() ? "text-accent-content btn-accent" : undefined}
          />
        </Show>
        <IconButton
          label={t("technical_list.side_panel.close")}
          variant="ghost"
          size="sm"
          onClick={handleClose}
          icon={
            <HugeiconsIcon icon={Cancel01Icon} size={16} color="currentColor" strokeWidth={1} />
          }
        />
      </div>
    </div>
  );
};

const SidePanelSummary = () => {
  const { viewInfo, isSelectionMode, isWebsite } = useTechnicalSidebar();

  return (
    <Show when={viewInfo()}>
      {(vi) => (
        <Show when={!isSelectionMode()}>
          <div class="border-b border-solid border-base-200 px-6 py-3 text-sm text-base-content/70">
            <Show
              when={isWebsite()}
              fallback={
                <div class="flex flex-wrap items-center gap-2">
                  <span class="font-medium text-base-content">
                    {vi().totalFields} {t("technical_list.side_panel.fields_found")}
                    <Show when={vi().totalButtons > 0}>
                      {" "}
                      - {vi().totalButtons} {t("technical_list.side_panel.buttons_found")}
                    </Show>{" "}
                    {t("technical_list.side_panel.found")}
                  </span>
                  <span class="inline-flex items-center gap-1 rounded-md bg-base-200/60 px-2 py-1 text-xs text-base-content/70">
                    <HugeiconsIcon
                      icon={InformationCircleIcon}
                      size={12}
                      color="currentColor"
                      strokeWidth={1.6}
                    />
                    {t("technical_list.side_panel.hover_hint")}
                  </span>
                </div>
              }
            >
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-medium text-base-content">
                  {t("technical_list.side_panel.website_info")}
                </span>
                <span class="inline-flex items-center gap-1 rounded-md bg-base-200/60 px-2 py-1 text-xs text-base-content/70">
                  <HugeiconsIcon
                    icon={InformationCircleIcon}
                    size={12}
                    color="currentColor"
                    strokeWidth={1.6}
                  />
                  {t("technical_list.side_panel.click_to_copy")}
                </span>
              </div>
            </Show>
          </div>
        </Show>
      )}
    </Show>
  );
};

const PanelContent = () => {
  const {
    viewInfo,
    highlightField,
    highlightButton,
    clearFieldHighlight,
    clearButtonHighlight,
    isWebsite,
    hasFields,
    hasButtons,
    dbInfo,
  } = useTechnicalSidebar();

  const {
    searchTerm,
    showOnlyRequired,
    showOnlyReadonly,
    showOnlyFields,
    showOnlyButtons,
    setSearchTerm,
    setShowOnlyRequired,
    setShowOnlyReadonly,
    setShowOnlyFields,
    setShowOnlyButtons,
  } = useTechnicalListFilters();

  const filteredFields = createMemo(() => {
    const info = viewInfo();
    if (!info) return [];
    const term = searchTerm().toLowerCase();
    const onlyRequired = showOnlyRequired();
    const onlyReadonly = showOnlyReadonly();
    const onlyButtons = showOnlyButtons();
    return info.technicalFields.filter((field) => {
      const matchesSearch =
        field.name.toLowerCase().includes(term) || field.label?.toLowerCase().includes(term);
      const matchesRequired = !onlyRequired || field.canBeRequired;
      const matchesReadonly = !onlyReadonly || field.canBeReadonly;
      const matchesType = !onlyButtons;
      return matchesSearch && matchesRequired && matchesReadonly && matchesType;
    });
  });

  const filteredButtons = createMemo(() => {
    const info = viewInfo();
    if (!info) return [];
    const term = searchTerm().toLowerCase();
    const onlyFields = showOnlyFields();
    return info.technicalButtons.filter((button) => {
      const matchesSearch =
        button.name.toLowerCase().includes(term) || button.label?.toLowerCase().includes(term);
      const matchesType = !onlyFields;
      return matchesSearch && matchesType;
    });
  });

  const FieldsSection: JSX.Element = (
    <div class="space-y-3 border-b border-solid border-base-200 px-6 py-4">
      <div class="flex items-center gap-2 text-xs font-semibold tracking-wide text-base-content/50 uppercase">
        <HugeiconsIcon icon={InputShortTextIcon} size={16} color="currentColor" strokeWidth={1.6} />
        {t("technical_list.side_panel.fields_list")} ({filteredFields().length})
      </div>
      <div class="space-y-3">
        <For each={filteredFields()}>
          {(field) => (
            <FieldItem
              field={field}
              onHighlight={highlightField}
              onClearHighlight={clearFieldHighlight}
            />
          )}
        </For>
      </div>
    </div>
  );

  const ButtonsSection: JSX.Element = (
    <div class="space-y-3 px-6 py-4">
      <div class="flex items-center gap-2 text-xs font-semibold tracking-wide text-base-content/50 uppercase">
        <HugeiconsIcon
          icon={MouseLeftClick06Icon}
          size={16}
          color="currentColor"
          strokeWidth={1.6}
        />
        {t("technical_list.side_panel.buttons_list")} ({filteredButtons().length})
      </div>
      <div class="space-y-3">
        <For each={filteredButtons()}>
          {(button) => (
            <ButtonItem
              button={button}
              onHighlight={highlightButton}
              onClearHighlight={clearButtonHighlight}
            />
          )}
        </For>
      </div>
    </div>
  );

  return (
    <Show when={viewInfo()}>
      {(info) => (
        <>
          <Show when={dbInfo()}>
            {(db) => (
              <Show when={!isWebsite()}>
                <DatabaseInfoComponent dbInfo={db()} />
              </Show>
            )}
          </Show>

          <Show
            when={info().websiteInfo}
            fallback={
              <Show when={info().currentModel}>
                <RecordInfo />
              </Show>
            }
          >
            {(websiteInfo) => <WebsiteInfo websiteInfo={websiteInfo()} />}
          </Show>

          <Show when={hasFields() || hasButtons()}>
            <FieldFilters
              searchTerm={searchTerm()}
              onSearchChange={setSearchTerm}
              showOnlyRequired={showOnlyRequired()}
              onRequiredChange={setShowOnlyRequired}
              showOnlyReadonly={showOnlyReadonly()}
              onReadonlyChange={setShowOnlyReadonly}
              showOnlyFields={showOnlyFields()}
              onFieldsChange={setShowOnlyFields}
              showOnlyButtons={showOnlyButtons()}
              onButtonsChange={setShowOnlyButtons}
            />
          </Show>

          <Show when={filteredFields().length > 0}>{FieldsSection}</Show>
          <Show when={filteredButtons().length > 0}>{ButtonsSection}</Show>

          <Show when={filteredFields().length === 0 && filteredButtons().length === 0}>
            <Show when={hasFields() || hasButtons()}>
              <div class="p-6">
                <EmptyState
                  icon={
                    <HugeiconsIcon
                      icon={FilterIcon}
                      size={32}
                      color="currentColor"
                      strokeWidth={1.6}
                    />
                  }
                  message={t("technical_list.side_panel.no_match")}
                />
              </div>
            </Show>
            <Show when={!hasFields() && !hasButtons() && !isWebsite()}>
              <div class="p-6">
                <EmptyState
                  icon={
                    <HugeiconsIcon
                      icon={InformationCircleIcon}
                      size={32}
                      color="currentColor"
                      strokeWidth={1.6}
                    />
                  }
                  message={t("technical_list.side_panel.no_fields")}
                />
              </div>
            </Show>
          </Show>
        </>
      )}
    </Show>
  );
};

const SelectedFieldContent = () => {
  const { selectedFieldInfo, highlightField, clearFieldHighlight } = useTechnicalSidebar();

  return (
    <Show
      when={selectedFieldInfo()}
      fallback={
        <div class="p-6">
          <EmptyState
            icon={
              <HugeiconsIcon icon={Select02Icon} size={32} color="currentColor" strokeWidth={1.6} />
            }
            message={t("technical_list.side_panel.click_field_detail")}
          />
        </div>
      }
    >
      {(field) => (
        <div class="px-6 py-4">
          <div class="mb-1 flex items-center gap-2 px-3 py-2 text-sm font-semibold text-base-content">
            <HugeiconsIcon
              icon={ZoomInAreaIcon}
              size={24}
              color="var(--color-accent)"
              strokeWidth={1.6}
            />
            <span>{t("technical_list.side_panel.selected_field")}</span>
          </div>
          <FieldItem
            field={field()}
            onHighlight={highlightField}
            onClearHighlight={clearFieldHighlight}
          />
        </div>
      )}
    </Show>
  );
};

const SelectedButtonContent = () => {
  const { selectedButtonInfo, highlightButton, clearButtonHighlight } = useTechnicalSidebar();

  return (
    <Show
      when={selectedButtonInfo()}
      fallback={
        <div class="p-6">
          <EmptyState
            icon={
              <HugeiconsIcon icon={Select02Icon} size={32} color="currentColor" strokeWidth={1.6} />
            }
            message={t("technical_list.side_panel.click_button_detail")}
          />
        </div>
      }
    >
      {(button) => (
        <div class="px-6 py-4">
          <div class="mb-1 flex items-center gap-2 px-3 py-2 text-sm font-semibold text-base-content">
            <HugeiconsIcon
              icon={ZoomInAreaIcon}
              size={24}
              color="var(--color-accent)"
              strokeWidth={1.6}
            />
            <span>{t("technical_list.side_panel.selected_button")}</span>
          </div>
          <ButtonItem
            button={button()}
            onHighlight={highlightButton}
            onClearHighlight={clearButtonHighlight}
          />
        </div>
      )}
    </Show>
  );
};

export const SidePanel = () => {
  const {
    isExpanded,
    loading,
    error,
    clearAllHighlights,
    isSelectionMode,
    selectedFieldInfo,
    selectedButtonInfo,
    viewInfo,
  } = useTechnicalSidebar();
  const position = getTechnicalListPosition();

  return (
    <div
      data-technical-list-panel="true"
      dir={getDir()}
      onMouseLeave={clearAllHighlights}
      class={[
        "fixed",
        "top-0",
        position === "left" ? "left-0" : "right-0",
        "z-1000",
        "h-screen",
        "w-[400px]",
        "max-md:w-full",
        "bg-base-300",
        position === "left" ? "border-r" : "border-l",
        "border-base-200",
        "transition-transform",
        "duration-300",
        "ease-in-out",
        "flex",
        "flex-col",
        "overflow-hidden",
      ].join(" ")}
      style={{
        transform: isExpanded()
          ? "translateX(0)"
          : position === "left"
            ? "translateX(-100%)"
            : "translateX(100%)",
        transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <SidePanelHeader />
      <SidePanelSummary />

      <div class="flex-1 overflow-y-auto">
        <Show when={loading()}>
          <LoadingState />
        </Show>
        <Show when={error()}>{(err) => <ErrorState message={err()} />}</Show>

        <Show when={isSelectionMode() && !loading() && !error()}>
          <Show when={selectedFieldInfo()}>
            <SelectedFieldContent />
          </Show>
          <Show when={selectedButtonInfo()}>
            <SelectedButtonContent />
          </Show>
          <Show when={!selectedFieldInfo() && !selectedButtonInfo()}>
            <EmptyState
              icon={
                <HugeiconsIcon
                  icon={Select02Icon}
                  size={32}
                  color="currentColor"
                  strokeWidth={1.6}
                />
              }
              message={t("technical_list.side_panel.click_element_detail")}
            />
          </Show>
        </Show>

        <Show when={!isSelectionMode() && viewInfo() && !loading() && !error()}>
          <PanelContent />
        </Show>
      </div>
    </div>
  );
};
