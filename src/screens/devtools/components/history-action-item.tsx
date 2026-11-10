import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  PencilEdit01Icon,
  PinIcon,
  PinOffIcon,
  Tick02Icon,
  Undo02Icon,
} from "@hugeicons/core-free-icons";
import { createSignal, Show } from "solid-js";

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
  HISTORY_ACTION_KINDS,
  historyActionIcon,
  historyActionOperation,
  historyActionSummary,
  historyRestorePlan,
} from "@/screens/devtools/history-actions";
import {
  removeHistoryAction,
  setHistoryActionLabel,
  setHistoryActionPinned,
} from "@/screens/devtools/history-signals";
import { navigate } from "@/screens/devtools/router";
import { getLocale, localeVersion, t } from "@/services/i18n-service";
import type { HistoryAction } from "@/types";
import { showNotification } from "@/utils/notifications";
import { formatRelativeTime, intlLocale } from "@/utils/relative-time";

const restoreAction = (action: HistoryAction) => {
  const plan = historyRestorePlan(action);
  resetRpcQuery();
  resetRpcResult();
  setRpcQuery(plan.query);
  if (plan.draft) setDraft(plan.draft.key, plan.draft.value);
  navigate(plan.tab);
  showNotification(t("devtools.history.restore_success", [action.type, action.model]), "success");
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
