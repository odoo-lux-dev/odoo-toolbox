import {
  Add01Icon,
  ArchiveArrowDownIcon,
  ArchiveArrowUpIcon,
  ArrowDown01Icon,
  ArrowRight01Icon,
  Delete02Icon,
  FunctionSquareIcon,
  PencilEdit01Icon,
  PinIcon,
  PinOffIcon,
  Search01Icon,
  TransactionHistoryIcon,
} from "@hugeicons/core-free-icons";
import { createMemo, createSignal, For, Show, type Accessor, type JSX } from "solid-js";

import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Modal } from "@/components/ui/modal";
import {
  resetRpcQuery,
  resetRpcResult,
  setCallMethodName,
  setCreateValues,
  setRpcQuery,
  setWriteValues,
} from "@/screens/devtools/devtools-signals";
import { removeHistoryAction, setHistoryActionPinned } from "@/screens/devtools/history-signals";
import { navigate } from "@/screens/devtools/Layout";
import { MAX_HISTORY_ENTRIES } from "@/services/history-service";
import { getLocale, localeVersion, t } from "@/services/i18n-service";
import { Logger } from "@/services/logger";
import type { HistoryAction, HistoryActionType } from "@/types";
import { ERROR_NOTIFICATION_TIMEOUT, showNotification } from "@/utils/notifications";

interface HistoryActionRestoreProps {
  action: HistoryAction;
}

export const HistoryActionRestore = (props: HistoryActionRestoreProps) => {
  const handleRestore = async () => {
    try {
      resetRpcQuery();
      resetRpcResult();

      switch (props.action.type) {
        case "search":
          await restoreSearchAction(props.action);
          break;
        case "write":
          await restoreWriteAction(props.action);
          break;
        case "create":
          await restoreCreateAction(props.action);
          break;
        case "call-method":
          await restoreCallMethodAction(props.action);
          break;
        case "unlink":
          await restoreUnlinkAction(props.action);
          break;
      }

      showNotification(
        t("devtools.history.restore_success", [props.action.type, props.action.model]),
        "success",
      );
    } catch (error) {
      showNotification(
        t("devtools.history.restore_failed", [
          error instanceof Error ? error.message : t("common.unknown_error"),
        ]),
        "error",
        ERROR_NOTIFICATION_TIMEOUT,
      );
    }
  };

  const restoreSearchAction = async (action: HistoryAction) => {
    if (action.type !== "search") return;

    const { model, domain, selectedFields, ids, limit, offset, orderBy } = action.parameters;

    setRpcQuery({
      model,
      domain,
      selectedFields,
      ids,
      limit,
      offset,
      orderBy,
    });

    navigate("/search");
  };

  const restoreWriteAction = async (action: HistoryAction) => {
    if (action.type !== "write") return;

    const { model, ids, values } = action.parameters;

    setRpcQuery({
      model,
      ids,
      domain: "[]",
      selectedFields: [],
      limit: 80,
      offset: 0,
      orderBy: "",
    });

    setWriteValues(JSON.stringify(values, null, 2));

    navigate("/write");
  };

  const restoreCreateAction = async (action: HistoryAction) => {
    if (action.type !== "create") return;

    const { model, values } = action.parameters;

    setRpcQuery({
      model,
      domain: "[]",
      selectedFields: [],
      ids: "",
      limit: 80,
      offset: 0,
      orderBy: "",
    });

    setCreateValues(JSON.stringify(values, null, 2));

    navigate("/create");
  };

  const restoreCallMethodAction = async (action: HistoryAction) => {
    if (action.type !== "call-method") return;

    const { model, ids, method } = action.parameters;

    setRpcQuery({
      model,
      ids,
      domain: "[]",
      selectedFields: [],
      limit: 80,
      offset: 0,
      orderBy: "",
    });

    setCallMethodName(method);

    navigate("/call-method");
  };

  const restoreUnlinkAction = async (action: HistoryAction) => {
    if (action.type !== "unlink") return;

    const { model, ids } = action.parameters;

    setRpcQuery({
      model,
      ids,
      domain: "[]",
      selectedFields: [],
      limit: 80,
      offset: 0,
      orderBy: "",
    });

    navigate("/unlink");
  };

  return (
    <div class="flex items-center">
      <Button
        type="button"
        variant="outline"
        color="secondary"
        size="sm"
        class="gap-2"
        onClick={handleRestore}
        title={t("devtools.history.restore_hint", [props.action.type])}
      >
        <span class="flex items-center gap-2">
          <HugeiconsIcon
            icon={TransactionHistoryIcon}
            size={14}
            color="currentColor"
            strokeWidth={1.6}
          />
          <span>{t("devtools.history.restore")}</span>
        </span>
      </Button>
    </div>
  );
};

interface HistoryActionItemProps {
  action: HistoryAction;
}

const getActionOperation = (action: HistoryAction): string => {
  if (action.type === "unlink") {
    return action.parameters.operation;
  }
  return action.type;
};

const renderIcon = (icon: typeof Search01Icon, size = 18) => (
  <HugeiconsIcon icon={icon} size={size} color="currentColor" strokeWidth={1.6} />
);

const getActionIcon = (action: HistoryAction): JSX.Element => {
  if (action.type === "unlink") {
    const operation = action.parameters.operation;
    switch (operation) {
      case "archive":
        return renderIcon(ArchiveArrowDownIcon);
      case "unarchive":
        return renderIcon(ArchiveArrowUpIcon);
      case "delete":
        return renderIcon(Delete02Icon);
      default:
        return renderIcon(Delete02Icon);
    }
  }

  const defaultIcons: Record<Exclude<HistoryAction["type"], "unlink">, JSX.Element> = {
    search: renderIcon(Search01Icon),
    write: renderIcon(PencilEdit01Icon),
    create: renderIcon(Add01Icon),
    "call-method": renderIcon(FunctionSquareIcon),
  };

  return defaultIcons[action.type as Exclude<HistoryAction["type"], "unlink">];
};

const ACTION_TYPE_COLORS: Record<HistoryAction["type"], string> = {
  search: "border-s-2 border-s-info",
  write: "border-s-2 border-s-warning",
  create: "border-s-2 border-s-success",
  "call-method": "border-s-2 border-s-secondary",
  unlink: "border-s-2 border-s-error",
};

export const HistoryActionItem = (props: HistoryActionItemProps) => {
  const [isExpanded, setIsExpanded] = createSignal(false);
  const [isDeleting, setIsDeleting] = createSignal(false);
  const [isPinning, setIsPinning] = createSignal(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = createSignal(false);

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      await removeHistoryAction(props.action.id);
      setIsDeleteModalOpen(false);
    } catch (error) {
      Logger.error("Failed to delete history action:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
  };

  const handleTogglePin = async () => {
    try {
      setIsPinning(true);
      await setHistoryActionPinned(props.action.id, !props.action.pinned);
    } catch (error) {
      Logger.error("Failed to update pinned history action:", error);
    } finally {
      setIsPinning(false);
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded());
  };

  const formatTimestamp = (timestamp: number) => {
    localeVersion();
    const locale = getLocale().replace("_", "-");
    const diff = Date.now() - timestamp;
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

    const units: [Intl.RelativeTimeFormatUnit, number][] = [
      ["second", 1000],
      ["minute", 60000],
      ["hour", 3600000],
      ["day", 86400000],
    ];

    for (const [unit, ms] of units) {
      if (diff < ms * (["second", "minute"].includes(unit) ? 60 : unit === "hour" ? 24 : 7)) {
        return rtf.format(-Math.floor(diff / ms), unit);
      }
    }

    const date = new Date(timestamp);
    return date.toLocaleDateString(locale) + " " + date.toLocaleTimeString(locale);
  };

  return (
    <div
      class={`rounded-md border border-base-300 bg-base-100 ${ACTION_TYPE_COLORS[props.action.type]} ${props.action.pinned ? "bg-warning/5 ring-1 ring-warning/40" : ""}`}
    >
      <div
        class="group flex cursor-pointer items-center justify-between gap-3 p-2 select-none hover:bg-base-200/70"
        onClick={toggleExpanded}
      >
        <div class="flex min-w-0 flex-1 items-center gap-3">
          <IconButton
            type="button"
            label={isExpanded() ? t("devtools.history.collapse") : t("devtools.history.expand")}
            variant="ghost"
            size="xs"
            square
            class="text-base-content/60 group-hover:text-base-content hover:bg-base-200/70"
            onClick={(e) => {
              e.stopPropagation();
              toggleExpanded();
            }}
            icon={
              <HugeiconsIcon
                icon={isExpanded() ? ArrowDown01Icon : ArrowRight01Icon}
                size={16}
                color="currentColor"
                strokeWidth={1.6}
              />
            }
          />
          <div class="flex w-5 text-base-content/70" title={getActionOperation(props.action)}>
            {getActionIcon(props.action)}
          </div>
          <div class="flex min-w-0 flex-1 flex-col gap-1">
            <div class="flex flex-wrap items-center gap-2 text-xs text-base-content/60">
              <span
                class="cursor-text rounded-sm bg-base-200 px-1.5 py-0.5 font-mono text-[10px] select-text"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                {props.action.model}
              </span>
              <Show when={props.action.pinned}>
                <span class="opacity-50">•</span>
                <span class="rounded-full bg-warning/20 px-2 py-0.5 text-[10px] font-semibold text-warning">
                  {t("devtools.history.pinned")}
                </span>
              </Show>
              <Show when={props.action.database}>
                <span class="opacity-50">•</span>
                <span
                  class="cursor-text rounded-sm bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-primary select-text"
                  title={t("devtools.history.database_title", [props.action.database ?? ""])}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  {props.action.database}
                </span>
              </Show>
              <span class="opacity-50">•</span>
              <span class="whitespace-nowrap">{formatTimestamp(props.action.timestamp)}</span>
            </div>
          </div>
        </div>

        <div
          class="flex shrink-0 items-center gap-2"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            type="button"
            variant="outline"
            color="warning"
            size="sm"
            onClick={handleTogglePin}
            disabled={isPinning()}
            title={
              props.action.pinned
                ? t("devtools.history.unpin_hint")
                : t("devtools.history.pin_hint")
            }
          >
            <span class="flex items-center gap-2">
              <HugeiconsIcon
                icon={props.action.pinned ? PinOffIcon : PinIcon}
                size={14}
                color="currentColor"
                strokeWidth={1.6}
              />
              <span>
                {isPinning()
                  ? t("devtools.history.saving")
                  : props.action.pinned
                    ? t("devtools.history.unpin")
                    : t("devtools.history.pin")}
              </span>
            </span>
          </Button>
          <HistoryActionRestore action={props.action} />
        </div>
      </div>

      <Show when={isExpanded()}>
        <div class="flex flex-col gap-4 border-t border-base-300 bg-base-200 p-4">
          <div class="flex flex-col gap-2">
            <h5 class="text-xs font-semibold text-base-content/70">
              {t("devtools.history.parameters")}
            </h5>
            <pre class="max-h-75 overflow-auto rounded-sm border border-base-300 bg-base-100 p-3 font-mono text-[11px] leading-relaxed whitespace-pre text-base-content/80">
              {JSON.stringify(props.action.parameters, null, 2)}
            </pre>
          </div>

          <div class="flex justify-end gap-2 border-t border-base-300 pt-2">
            <Button
              type="button"
              variant="outline"
              color="error"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting()}
            >
              {isDeleting()
                ? t("devtools.history.removing")
                : t("devtools.history.remove_from_history")}
            </Button>
          </div>
        </div>
      </Show>

      <Modal
        open={isDeleteModalOpen()}
        onClose={handleCancelDelete}
        title={t("devtools.history.remove_confirm_title")}
        description={t("devtools.history.remove_confirm_desc")}
        size="md"
        boxClass="border border-base-300"
        footer={
          <>
            <Button variant="outline" onClick={handleCancelDelete}>
              {t("common.cancel")}
            </Button>
            <Button color="error" onClick={handleConfirmDelete} disabled={isDeleting()}>
              {isDeleting() ? t("devtools.history.removing") : t("common.remove")}
            </Button>
          </>
        }
      />
    </div>
  );
};

interface HistoryFiltersProps {
  searchTerm: Accessor<string>;
  searchTermSetter: (value: string) => void;
  selectedType: Accessor<HistoryActionType | "all">;
  selectedTypeSetter: (value: HistoryActionType | "all") => void;
  selectedModel: Accessor<string | "all">;
  selectedModelSetter: (value: string | "all") => void;
  availableModels: string[];
  totalActions: number;
}

const ACTION_TYPE_LABELS: Record<HistoryActionType | "all", () => string> = {
  all: () => t("devtools.history.filters.all_actions"),
  search: () => t("devtools.history.filters.search"),
  write: () => t("devtools.history.filters.write"),
  create: () => t("devtools.history.filters.create"),
  "call-method": () => t("devtools.history.filters.call_method"),
  unlink: () => t("devtools.history.filters.delete_archive"),
};

export const HistoryFilters = (props: HistoryFiltersProps) => {
  const handleSearchChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    props.searchTermSetter(target.value);
  };

  const handleTypeChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    props.selectedTypeSetter(target.value as HistoryActionType | "all");
  };

  const handleModelChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    props.selectedModelSetter(target.value);
  };

  const clearFilters = () => {
    props.searchTermSetter("");
    props.selectedTypeSetter("all");
    props.selectedModelSetter("all");
  };

  const hasActiveFilters = createMemo(
    () =>
      props.searchTerm().trim() !== "" ||
      props.selectedType() !== "all" ||
      props.selectedModel() !== "all",
  );

  return (
    <div class="mx-3 flex flex-col gap-3 rounded-md border border-base-300 bg-base-200 p-4">
      <div class="flex flex-wrap items-end gap-3">
        <div class="flex min-w-30 flex-col gap-1 first:min-w-50 first:grow">
          <label for="history-search" class="text-xs font-medium text-base-content/70">
            {t("devtools.history.filters.search")}
          </label>
          <input
            id="history-search"
            type="text"
            class="input-bordered input w-full input-sm"
            placeholder={t("devtools.history.filters.search_placeholder")}
            value={props.searchTerm()}
            onInput={handleSearchChange}
          />
        </div>

        <div class="flex min-w-30 flex-col gap-1">
          <label for="action-type-filter" class="text-xs font-medium text-base-content/70">
            {t("devtools.history.filters.type")}
          </label>
          <select
            id="action-type-filter"
            class="select-bordered select w-full select-sm"
            value={props.selectedType()}
            onChange={handleTypeChange}
          >
            <For each={Object.keys(ACTION_TYPE_LABELS) as (HistoryActionType | "all")[]}>
              {(type) => <option value={type}>{ACTION_TYPE_LABELS[type]()}</option>}
            </For>
          </select>
        </div>

        <div class="flex min-w-30 flex-col gap-1">
          <label for="model-filter" class="text-xs font-medium text-base-content/70">
            {t("devtools.history.filters.model")}
          </label>
          <select
            id="model-filter"
            class="select-bordered select w-full select-sm"
            value={props.selectedModel()}
            onChange={handleModelChange}
          >
            <option value="all">{t("devtools.history.filters.all_models")}</option>
            <For each={props.availableModels}>
              {(model) => <option value={model}>{model}</option>}
            </For>
          </select>
        </div>

        <div class="flex min-w-30 flex-col gap-1">
          <Button
            type="button"
            variant="outline"
            color="secondary"
            size="sm"
            class="w-full sm:w-auto"
            onClick={clearFilters}
            disabled={!hasActiveFilters()}
            title={t("devtools.history.filters.clear_filters_hint")}
          >
            {t("devtools.history.filters.clear_filters")}
          </Button>
        </div>
      </div>

      <Show when={props.totalActions > 0}>
        <div class="border-t border-base-300 pt-2">
          <span class="text-xs text-base-content/60">
            {t("devtools.history.filters.total_actions", [
              String(props.totalActions),
              String(MAX_HISTORY_ENTRIES),
            ])}
          </span>
        </div>
      </Show>
    </div>
  );
};
