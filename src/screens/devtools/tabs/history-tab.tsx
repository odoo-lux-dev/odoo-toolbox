import { Search02Icon, TransactionHistoryIcon } from "@hugeicons/core-free-icons";
import { createSignal, createEffect, createMemo, Show, For } from "solid-js";

import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import {
  ConfirmationModal,
  useConfirmationModal,
} from "@/screens/devtools/components/confirmation-modal";
import { HistoryActionItem } from "@/screens/devtools/components/history";
import { HistoryFilters } from "@/screens/devtools/components/history";
import { useHistoryState } from "@/screens/devtools/history-signals";
import { t } from "@/services/i18n-service";
import type { HistoryActionType } from "@/types";

export const HistoryTab = () => {
  const { state, actions, loadHistory, clearHistory } = useHistoryState();
  const [searchTerm, setSearchTerm] = createSignal("");
  const [selectedType, setSelectedType] = createSignal<HistoryActionType | "all">("all");
  const [selectedModel, setSelectedModel] = createSignal<string | "all">("all");
  const { isOpen, config, openConfirmation, handleConfirm, handleCancel } = useConfirmationModal();

  createEffect(() => {
    loadHistory();
  });

  const availableModels = createMemo(() => {
    const models = new Set(actions().map((action) => action.model));
    return Array.from(models).sort();
  });

  const filteredActions = createMemo(() => {
    let filtered = actions();

    if (selectedType() !== "all") {
      filtered = filtered.filter((action) => action.type === selectedType());
    }

    if (selectedModel() !== "all") {
      filtered = filtered.filter((action) => action.model === selectedModel());
    }

    if (searchTerm().trim()) {
      const term = searchTerm().toLowerCase();
      filtered = filtered.filter((action) => action.model.toLowerCase().includes(term));
    }

    const pinned = filtered.filter((action) => action.pinned);
    const unpinned = filtered.filter((action) => !action.pinned);

    return [...pinned, ...unpinned];
  });

  const handleClearHistory = async () => {
    const confirmed = await openConfirmation({
      title: t("devtools.history.clear_all"),
      message: t("devtools.history.clear_confirm"),
      variant: "danger",
      confirmText: t("devtools.history.clear_all"),
      cancelText: t("common.cancel"),
    });
    if (confirmed) {
      await clearHistory();
    }
  };

  return (
    <Show
      when={!state().loading}
      fallback={
        <div class="flex flex-col items-center justify-center gap-3 p-10 text-center">
          <span class="loading loading-sm loading-spinner text-primary" />
          <span class="text-sm text-base-content/70">{t("devtools.history.loading")}</span>
        </div>
      }
    >
      <Show
        when={!state().error}
        fallback={
          <div class="flex flex-col items-center justify-center gap-3 p-10 text-center">
            <div class="flex flex-col items-center gap-2">
              <span class="text-sm text-base-content/70">
                {t("devtools.history.error", [state().error ?? ""])}
              </span>
              <Button
                type="button"
                variant="outline"
                color="primary"
                size="sm"
                onClick={loadHistory}
              >
                {t("common.retry")}
              </Button>
            </div>
          </div>
        }
      >
        <div class="flex h-full flex-col gap-4 pb-3">
          <div class="flex items-center justify-between gap-4 px-4 pt-3">
            <div class="flex items-center gap-3">
              <h3 class="text-base font-semibold text-base-content">
                {t("devtools.history.title")}
              </h3>
              <span class="rounded-full bg-base-200 px-2 py-0.5 text-xs text-base-content/70 tabular-nums">
                {filteredActions().length} {t("devtools.record_search.of")} {actions().length}{" "}
                {t("devtools.history.actions_count")}
              </span>
            </div>

            <div class="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                color="secondary"
                size="sm"
                onClick={() => loadHistory()}
                disabled={state().loading}
              >
                {t("devtools.history.refresh")}
              </Button>
              <Button
                type="button"
                variant="outline"
                color="error"
                size="sm"
                onClick={handleClearHistory}
                disabled={state().loading || actions().length === 0}
              >
                {t("devtools.history.clear_all")}
              </Button>
            </div>
          </div>

          <HistoryFilters
            searchTerm={searchTerm}
            searchTermSetter={setSearchTerm}
            selectedType={selectedType}
            selectedTypeSetter={setSelectedType}
            selectedModel={selectedModel}
            selectedModelSetter={setSelectedModel}
            availableModels={availableModels()}
            totalActions={actions().length}
          />

          <div class="overflow-y-auto px-2">
            <Show
              when={filteredActions().length > 0}
              fallback={
                <div class="flex items-center justify-center p-12 text-center">
                  <Show
                    when={actions().length === 0}
                    fallback={
                      <div class="flex max-w-sm flex-col items-center gap-3">
                        <div class="text-4xl opacity-60">
                          <HugeiconsIcon
                            icon={Search02Icon}
                            size={32}
                            color="currentColor"
                            strokeWidth={1.8}
                          />
                        </div>
                        <h4 class="m-0 font-medium text-base-content/70">
                          {t("devtools.history.no_results")}
                        </h4>
                        <p class="m-0 text-sm/relaxed text-base-content/60">
                          {t("devtools.history.no_results_hint")}
                        </p>
                      </div>
                    }
                  >
                    <div class="flex max-w-sm flex-col items-center gap-3">
                      <div class="text-4xl opacity-60">
                        <HugeiconsIcon
                          icon={TransactionHistoryIcon}
                          size={32}
                          color="currentColor"
                          strokeWidth={1.8}
                        />
                      </div>
                      <h4 class="m-0 font-medium text-base-content/70">
                        {t("devtools.history.empty_title")}
                      </h4>
                      <p class="m-0 text-sm/relaxed text-base-content/60">
                        {t("devtools.history.empty_desc")}
                      </p>
                    </div>
                  </Show>
                </div>
              }
            >
              <div class="flex flex-col gap-2 p-2">
                <For each={filteredActions()}>
                  {(action) => <HistoryActionItem action={action} />}
                </For>
              </div>
            </Show>
          </div>
        </div>
      </Show>
      <ConfirmationModal
        isOpen={isOpen()}
        config={config()}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </Show>
  );
};
