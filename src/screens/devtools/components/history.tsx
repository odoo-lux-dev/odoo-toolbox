import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  PencilEdit01Icon,
  PinIcon,
  PinOffIcon,
  Search01Icon,
  Tick02Icon,
  Undo02Icon,
} from "@hugeicons/core-free-icons";
import { createSignal, For, Show } from "solid-js";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { confirm } from "@/components/ui/confirm-dialog";
import { cx } from "@/components/ui/cx";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { IconTile } from "@/components/ui/icon-tile";
import { ToolButton } from "@/components/ui/tool-button";
import { EYEBROW_CLASS } from "@/screens/devtools/components/devtools-ui";
import { resetRpcQuery, resetRpcResult, setRpcQuery } from "@/screens/devtools/devtools-signals";
import { setDraft } from "@/screens/devtools/drafts";
import {
  EMPTY_HISTORY_FILTER,
  HISTORY_ACTION_KINDS,
  HISTORY_ACTION_TYPES,
  historyActionIcon,
  historyActionOperation,
  historyActionSummary,
  historyRestorePlan,
  isHistoryFilterActive,
  type HistoryFilter,
} from "@/screens/devtools/history-actions";
import {
  removeHistoryAction,
  setHistoryActionLabel,
  setHistoryActionPinned,
} from "@/screens/devtools/history-signals";
import { formatRelativeTime, intlLocale } from "@/screens/devtools/history-time";
import { navigate } from "@/screens/devtools/router";
import { MAX_HISTORY_ENTRIES } from "@/services/history-service";
import { getLocale, localeVersion, t } from "@/services/i18n-service";
import type { HistoryAction, HistoryActionType } from "@/types";
import { showNotification } from "@/utils/notifications";

const restoreAction = (action: HistoryAction) => {
  const plan = historyRestorePlan(action);
  resetRpcQuery();
  resetRpcResult();
  setRpcQuery(plan.query);
  if (plan.draft) setDraft(plan.draft.key, plan.draft.value);
  navigate(plan.tab);
  showNotification(t("devtools.history.restore_success", [action.type, action.model]), "success");
};

const ACTION_TYPE_LABELS: Record<HistoryActionType | "all", () => string> = {
  all: () => t("devtools.history.filters.all_actions"),
  ...(Object.fromEntries(
    HISTORY_ACTION_TYPES.map((type) => [type, HISTORY_ACTION_KINDS[type].label]),
  ) as Record<HistoryActionType, () => string>),
};

export const HistoryActionItem = (props: { action: HistoryAction }) => {
  const [isExpanded, setIsExpanded] = createSignal(false);
  const [isDeleting, setIsDeleting] = createSignal(false);
  const [isPinning, setIsPinning] = createSignal(false);
  const [isEditingLabel, setIsEditingLabel] = createSignal(false);
  const [labelDraft, setLabelDraft] = createSignal("");

  const kind = () => HISTORY_ACTION_KINDS[props.action.type];
  const summary = () => historyActionSummary(props.action);

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: t("devtools.history.remove_confirm_title"),
      message: t("devtools.history.remove_confirm_desc"),
      variant: "danger",
      confirmText: t("common.remove"),
    });
    if (!confirmed) return;
    setIsDeleting(true);
    await removeHistoryAction(props.action.id);
    setIsDeleting(false);
  };

  const handleTogglePin = async () => {
    setIsPinning(true);
    await setHistoryActionPinned(props.action.id, !props.action.pinned);
    setIsPinning(false);
  };

  const startEditLabel = () => {
    setLabelDraft(props.action.label ?? "");
    setIsEditingLabel(true);
  };

  const saveLabel = async () => {
    const trimmed = labelDraft().trim();
    if (trimmed !== (props.action.label ?? "")) {
      await setHistoryActionLabel(props.action.id, trimmed);
    }
    setIsEditingLabel(false);
  };

  const toggleExpanded = () => setIsExpanded(!isExpanded());

  const timestamp = () => {
    localeVersion();
    return formatRelativeTime(props.action.timestamp, intlLocale(getLocale()));
  };

  return (
    <div
      class={cx(
        "ot-card overflow-hidden",
        props.action.pinned ? "border-warning/40" : undefined,
        isExpanded() ? "shadow-card" : undefined,
      )}
    >
      <div
        class="ot-row group gap-3 select-none"
        data-interactive=""
        data-state={isExpanded() ? "open" : "closed"}
        onClick={toggleExpanded}
      >
        <IconTile tone={kind().tone} title={historyActionOperation(props.action)}>
          <HugeiconsIcon icon={historyActionIcon(props.action)} size={16} strokeWidth={1.6} />
        </IconTile>

        <div class="flex min-w-0 flex-1 flex-col gap-0.5">
          <div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span class="truncate text-body font-semibold text-ink">
              {kind().label()} ·{" "}
              <span
                class="cursor-text font-mono text-ui font-medium select-text"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                {props.action.model}
              </span>
            </span>
            <Show when={props.action.pinned}>
              <Chip shape="pill" tone="warning" class="text-micro tracking-wider uppercase">
                <HugeiconsIcon icon={PinIcon} size={10} strokeWidth={1.8} />
                {t("devtools.history.pinned")}
              </Chip>
              <Show when={props.action.label || isEditingLabel()}>
                <Show
                  when={isEditingLabel()}
                  fallback={
                    <span class="text-ui font-medium text-ink-2">{props.action.label}</span>
                  }
                >
                  <input
                    ref={(el) => requestAnimationFrame(() => el.focus())}
                    type="text"
                    class="input h-control-sm w-44 text-ui input-xs"
                    value={labelDraft()}
                    onInput={(e) => setLabelDraft(e.currentTarget.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveLabel();
                      if (e.key === "Escape") setIsEditingLabel(false);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    placeholder={t("devtools.history.label_placeholder")}
                  />
                </Show>
              </Show>
            </Show>
            <Show when={props.action.database}>
              <Chip
                class="cursor-text text-ink-3 select-text"
                title={t("devtools.history.database_title", [props.action.database ?? ""])}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                {props.action.database}
              </Chip>
            </Show>
          </div>
          <Show when={summary()}>
            <span class="truncate font-mono text-caption text-ink-3">{summary()}</span>
          </Show>
        </div>

        <div
          class="flex shrink-0 items-center gap-1"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <ToolButton
            size="sm"
            variant="outline"
            tone="warning"
            pressed={!!props.action.pinned}
            onClick={handleTogglePin}
            disabled={isPinning()}
            label={
              props.action.pinned
                ? t("devtools.history.unpin_hint")
                : t("devtools.history.pin_hint")
            }
            icon={
              <HugeiconsIcon
                icon={props.action.pinned ? PinOffIcon : PinIcon}
                size={14}
                strokeWidth={1.6}
              />
            }
          />
          <ToolButton
            size="sm"
            variant="outline"
            onClick={() => restoreAction(props.action)}
            label={`${t("devtools.history.restore")} — ${t("devtools.history.restore_hint", [props.action.type])}`}
            icon={<HugeiconsIcon icon={Undo02Icon} size={14} strokeWidth={1.6} />}
          />
          <Show when={props.action.pinned}>
            <ToolButton
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                if (isEditingLabel()) saveLabel();
                else startEditLabel();
              }}
              label={isEditingLabel() ? t("common.save") : t("devtools.history.edit_label")}
              icon={
                <HugeiconsIcon
                  icon={isEditingLabel() ? Tick02Icon : PencilEdit01Icon}
                  size={14}
                  strokeWidth={1.6}
                />
              }
            />
          </Show>
          <span class="ms-1.5 w-24 truncate text-end font-mono text-caption whitespace-nowrap text-ink-3">
            {timestamp()}
          </span>
          <ToolButton
            label={isExpanded() ? t("devtools.history.collapse") : t("devtools.history.expand")}
            size="sm"
            class="group-hover:text-ink"
            aria-expanded={isExpanded()}
            onClick={toggleExpanded}
            icon={
              <HugeiconsIcon
                icon={isExpanded() ? ArrowUp01Icon : ArrowDown01Icon}
                size={14}
                strokeWidth={1.6}
              />
            }
          />
        </div>
      </div>

      <Show when={isExpanded()}>
        <div class="flex flex-col gap-2 border-t border-line-soft px-3 py-2.5">
          <span class={EYEBROW_CLASS}>{t("devtools.history.parameters")}</span>
          <pre class="max-h-75 overflow-auto rounded-field border border-line bg-surface-inset px-3 py-2 font-mono text-caption/relaxed whitespace-pre text-ink-2">
            {JSON.stringify(props.action.parameters, null, 2)}
          </pre>
          <div class="flex justify-end border-t border-line-soft pt-2">
            <Button
              type="button"
              variant="ghost"
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
    </div>
  );
};

interface HistoryFiltersProps {
  filter: HistoryFilter;
  onChange: (patch: Partial<HistoryFilter>) => void;
  availableModels: string[];
  totalActions: number;
  /** Visible / total counter displayed at the end of the filter bar. */
  resultsLabel?: string;
}

export const HistoryFilters = (props: HistoryFiltersProps) => {
  return (
    <div class="flex flex-col gap-1.5">
      <div class="flex flex-wrap items-center gap-2.5 rounded-box border border-line bg-surface px-2.5 py-2">
        {/* Read by screen readers; a theme may show it (`.ot-field-label`) */}
        <label for="history-search" class="ot-field-label self-center">
          {t("devtools.history.filters.search")}
        </label>
        <label class="input h-control min-w-50 flex-1 gap-1.5 border-line bg-surface-2 input-sm">
          <HugeiconsIcon
            icon={Search01Icon}
            size={14}
            strokeWidth={1.6}
            class="shrink-0 text-ink-3"
          />
          <input
            id="history-search"
            type="search"
            class="min-w-0 grow text-ui"
            placeholder={t("devtools.history.filters.search_placeholder")}
            value={props.filter.search}
            onInput={(e) => props.onChange({ search: e.currentTarget.value })}
          />
        </label>

        <label for="action-type-filter" class="flex items-center gap-1.5">
          <span class={EYEBROW_CLASS}>{t("devtools.history.filters.type")}</span>
          <select
            id="action-type-filter"
            class="select h-control w-auto min-w-32 text-ui select-sm"
            value={props.filter.type}
            onChange={(e) =>
              props.onChange({ type: e.currentTarget.value as HistoryFilter["type"] })
            }
          >
            <For each={Object.keys(ACTION_TYPE_LABELS) as (HistoryActionType | "all")[]}>
              {(type) => <option value={type}>{ACTION_TYPE_LABELS[type]()}</option>}
            </For>
          </select>
        </label>

        <label for="model-filter" class="flex items-center gap-1.5">
          <span class={EYEBROW_CLASS}>{t("devtools.history.filters.model")}</span>
          <select
            id="model-filter"
            class="select h-control w-auto min-w-32 text-ui select-sm"
            value={props.filter.model}
            onChange={(e) => props.onChange({ model: e.currentTarget.value })}
          >
            <option value="all">{t("devtools.history.filters.all_models")}</option>
            <For each={props.availableModels}>
              {(model) => <option value={model}>{model}</option>}
            </For>
          </select>
        </label>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          class="text-ink-2"
          onClick={() => props.onChange(EMPTY_HISTORY_FILTER)}
          disabled={!isHistoryFilterActive(props.filter)}
          title={t("devtools.history.filters.clear_filters_hint")}
        >
          {t("devtools.history.filters.clear_filters")}
        </Button>

        <Show when={props.resultsLabel}>
          <span class="ms-auto font-mono text-caption text-ink-3 tabular-nums">
            {props.resultsLabel}
          </span>
        </Show>
      </div>

      <Show when={props.totalActions > 0}>
        <span class="px-1 text-small text-ink-4">
          {t("devtools.history.filters.total_actions", [
            String(props.totalActions),
            String(MAX_HISTORY_ENTRIES),
          ])}
        </span>
      </Show>
    </div>
  );
};
