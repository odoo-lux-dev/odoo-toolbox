import { Delete02Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { createSignal, For, onCleanup, onMount, Show } from "solid-js";

import { Button, IconButton } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { IgnoredDebugPathsDeleteModal } from "@/screens/options/components/ignored-debug-paths-delete-modal";
import { t } from "@/services/i18n-service";
import { settingsService } from "@/services/settings-service";
import type { DebugPathIgnoreScope, IgnoredDebugPath } from "@/types";

const SCOPE_OPTIONS: DebugPathIgnoreScope[] = ["domain", "path", "domain_path"];

const getScopeLabel = (scope: DebugPathIgnoreScope): string => {
  switch (scope) {
    case "domain":
      return t("options.ignored_debug.scope_domain");
    case "path":
      return t("options.ignored_debug.scope_path");
    case "domain_path":
      return t("options.ignored_debug.scope_domain_path");
  }
};

const getSummary = (path: IgnoredDebugPath): string => {
  switch (path.scope) {
    case "domain":
      return path.domain;
    case "path":
      return path.path;
    case "domain_path":
      return `${path.domain}${path.path}`;
  }
};

interface IgnoredDebugPathsModalProps {
  open: boolean;
  onClose: () => void;
}

export const IgnoredDebugPathsModal = (props: IgnoredDebugPathsModalProps) => {
  const [paths, setPaths] = createSignal<IgnoredDebugPath[]>([]);
  const [scope, setScope] = createSignal<DebugPathIgnoreScope>("domain_path");
  const [domain, setDomain] = createSignal("");
  const [path, setPath] = createSignal("");
  const [deleteTarget, setDeleteTarget] = createSignal<IgnoredDebugPath | null>(null);

  const load = async () => {
    setPaths(await settingsService.getIgnoredDebugPaths());
  };

  onMount(() => {
    load();
    const unwatch = settingsService.watchSettings(() => {
      load();
    });
    onCleanup(unwatch);
  });

  const resetForm = () => {
    setScope("domain_path");
    setDomain("");
    setPath("");
  };

  const handleAdd = async (event?: SubmitEvent) => {
    event?.preventDefault();
    const currentScope = scope();
    const domainValue = domain().trim();
    const pathValue = path().trim();

    let entry: IgnoredDebugPath;
    if (currentScope === "path") {
      if (!pathValue) return;
      entry = { scope: "path", path: pathValue, deletable: true };
    } else if (currentScope === "domain") {
      if (!domainValue) return;
      entry = { scope: "domain", domain: domainValue, deletable: true };
    } else {
      if (!domainValue || !pathValue) return;
      entry = { scope: "domain_path", domain: domainValue, path: pathValue, deletable: true };
    }

    await settingsService.addIgnoredDebugPath(entry);
    await load();
    resetForm();
  };

  const handleAskRemove = (item: IgnoredDebugPath) => {
    setDeleteTarget(item);
  };

  const handleConfirmRemove = async () => {
    const target = deleteTarget();
    if (!target) return;
    await settingsService.removeIgnoredDebugPath(target);
    setDeleteTarget(null);
    await load();
  };

  const deleteSummary = () => {
    const target = deleteTarget();
    return target ? getSummary(target) : "";
  };

  return (
    <>
      <Modal
        open={props.open}
        onClose={props.onClose}
        title={t("options.ignored_debug.title")}
        description={t("options.ignored_debug.desc")}
        size="full"
      >
        <div class="flex flex-col gap-4">
          <p class="text-sm opacity-80">{t("options.ignored_debug.hint")}</p>

          <form class="flex flex-col gap-2 md:flex-row" onSubmit={handleAdd}>
            <select
              class="select select-sm md:w-44"
              aria-label={t("options.ignored_debug.scope_label")}
              onChange={(e) => setScope(e.currentTarget.value as DebugPathIgnoreScope)}
            >
              <For each={SCOPE_OPTIONS}>
                {(option) => <option value={option}>{getScopeLabel(option)}</option>}
              </For>
            </select>
            <Show when={scope() === "domain" || scope() === "domain_path"}>
              <Input
                class="flex-1"
                size="sm"
                placeholder={t("options.ignored_debug.domain_placeholder")}
                value={domain()}
                onInput={(e) => setDomain(e.currentTarget.value)}
              />
            </Show>
            <Show when={scope() === "path" || scope() === "domain_path"}>
              <Input
                class="flex-1"
                size="sm"
                placeholder={t("options.ignored_debug.path_placeholder")}
                value={path()}
                onInput={(e) => setPath(e.currentTarget.value)}
              />
            </Show>
            <Button
              type="submit"
              size="sm"
              color="primary"
              class="md:w-32"
              disabled={
                (scope() === "domain" && !domain().trim()) ||
                (scope() === "path" && !path().trim()) ||
                (scope() === "domain_path" && (!domain().trim() || !path().trim()))
              }
            >
              <HugeiconsIcon icon={PlusSignIcon} size={16} color="currentColor" strokeWidth={2} />
              {t("options.ignored_debug.add")}
            </Button>
          </form>

          <Show
            when={paths().length > 0}
            fallback={<p class="text-sm opacity-80">{t("options.ignored_debug.empty")}</p>}
          >
            <div class="flex max-h-72 flex-col gap-2 overflow-y-auto">
              <For each={paths()}>
                {(item) => (
                  <div class="card bg-base-200 shadow-sm">
                    <div class="card-body flex-row items-center gap-3 px-4 py-3">
                      <div class="flex-1">
                        <div class="flex flex-wrap items-center gap-2">
                          <span class="badge badge-sm badge-neutral">
                            {getScopeLabel(item.scope)}
                          </span>
                          <span class="text-sm font-medium">{getSummary(item)}</span>
                        </div>
                      </div>
                      <Show when={item.deletable}>
                        <IconButton
                          size="sm"
                          variant="outline"
                          color="error"
                          label={t("options.ignored_debug.delete")}
                          onClick={() => handleAskRemove(item)}
                          icon={
                            <HugeiconsIcon
                              icon={Delete02Icon}
                              size={16}
                              color="currentColor"
                              strokeWidth={2}
                            />
                          }
                        />
                      </Show>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>
      </Modal>
      <IgnoredDebugPathsDeleteModal
        open={deleteTarget() !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmRemove}
        summary={deleteSummary()}
      />
    </>
  );
};
