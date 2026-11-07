import { Delete02Icon, InformationCircleIcon, PlusSignIcon } from "@hugeicons/core-free-icons";
import { createSignal, For, Show } from "solid-js";

import { Alert } from "@/components/ui/alert";
import { Button, IconButton } from "@/components/ui/button";
import { confirm } from "@/components/ui/confirm-dialog";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useSettings } from "@/hooks/use-settings";
import { t } from "@/services/i18n-service";
import { settingsService } from "@/services/settings-service";
import type { DebugPathIgnoreScope, IgnoredDebugPath } from "@/types";

/** What each scope matches: its label, the fields it needs and how it reads. */
const SCOPES: Record<
  DebugPathIgnoreScope,
  { label: string; domain: boolean; path: boolean; summary: (entry: IgnoredDebugPath) => string }
> = {
  domain: {
    label: "options.ignored_debug.scope_domain",
    domain: true,
    path: false,
    summary: (entry) => ("domain" in entry ? entry.domain : ""),
  },
  path: {
    label: "options.ignored_debug.scope_path",
    domain: false,
    path: true,
    summary: (entry) => ("path" in entry ? entry.path : ""),
  },
  domain_path: {
    label: "options.ignored_debug.scope_domain_path",
    domain: true,
    path: true,
    summary: (entry) => (entry.scope === "domain_path" ? `${entry.domain}${entry.path}` : ""),
  },
};

const SCOPE_OPTIONS = Object.keys(SCOPES) as DebugPathIgnoreScope[];

const summaryOf = (entry: IgnoredDebugPath) => SCOPES[entry.scope].summary(entry);

export const IgnoredDebugPathsModal = (props: { open: boolean; onClose: () => void }) => {
  const settings = useSettings();
  const [scope, setScope] = createSignal<DebugPathIgnoreScope>("domain");
  const [domain, setDomain] = createSignal("");
  const [path, setPath] = createSignal("");

  const fields = () => SCOPES[scope()];

  /** Entry described by the form, `undefined` while a required field is empty. */
  const entry = (): IgnoredDebugPath | undefined => {
    const domainValue = domain().trim();
    const pathValue = path().trim();
    if ((fields().domain && !domainValue) || (fields().path && !pathValue)) return undefined;
    switch (scope()) {
      case "domain":
        return { scope: "domain", domain: domainValue, deletable: true };
      case "path":
        return { scope: "path", path: pathValue, deletable: true };
      case "domain_path":
        return { scope: "domain_path", domain: domainValue, path: pathValue, deletable: true };
    }
  };

  const handleRemove = async (item: IgnoredDebugPath) => {
    const confirmed = await confirm({
      title: t("options.ignored_debug.delete_title"),
      message: t("options.ignored_debug.delete_desc", [summaryOf(item)]),
      confirmText: t("common.delete"),
      variant: "danger",
    });
    if (confirmed) await settingsService.removeIgnoredDebugPath(item);
  };

  const handleAdd = async (event: SubmitEvent) => {
    event.preventDefault();
    const value = entry();
    if (!value) return;
    await settingsService.addIgnoredDebugPath(value);
    setScope("domain");
    setDomain("");
    setPath("");
  };

  return (
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
            value={scope()}
            onChange={(e) => setScope(e.currentTarget.value as DebugPathIgnoreScope)}
          >
            <For each={SCOPE_OPTIONS}>
              {(option) => <option value={option}>{t(SCOPES[option].label)}</option>}
            </For>
          </select>
          <Show when={fields().domain}>
            <Input
              class="flex-1"
              size="sm"
              placeholder={t("options.ignored_debug.domain_placeholder")}
              value={domain()}
              onInput={(e) => setDomain(e.currentTarget.value)}
            />
          </Show>
          <Show when={fields().path}>
            <Input
              class="flex-1"
              size="sm"
              placeholder={t("options.ignored_debug.path_placeholder")}
              value={path()}
              onInput={(e) => setPath(e.currentTarget.value)}
            />
          </Show>
          <Button type="submit" size="sm" color="primary" class="md:w-32" disabled={!entry()}>
            <HugeiconsIcon icon={PlusSignIcon} size={16} strokeWidth={2} />
            {t("options.ignored_debug.add")}
          </Button>
        </form>

        <Show when={fields().domain}>
          <Alert
            color="info"
            variant="soft"
            icon={<HugeiconsIcon icon={InformationCircleIcon} size={20} strokeWidth={2} />}
            class="text-sm"
          >
            <span>{t("options.ignored_debug.domain_hint")}</span>
          </Alert>
        </Show>

        <Show
          when={settings().ignoredDebugPaths.length > 0}
          fallback={<p class="text-sm opacity-80">{t("options.ignored_debug.empty")}</p>}
        >
          <div class="flex max-h-72 flex-col gap-2 overflow-y-auto">
            <For each={settings().ignoredDebugPaths}>
              {(item) => (
                <div class="card bg-base-200 shadow-sm">
                  <div class="card-body flex-row items-center gap-3 px-4 py-3">
                    <div class="flex-1">
                      <div class="flex flex-wrap items-center gap-2">
                        <span class="badge badge-sm badge-neutral">
                          {t(SCOPES[item.scope].label)}
                        </span>
                        <span class="text-sm font-medium">{summaryOf(item)}</span>
                      </div>
                    </div>
                    <Show when={item.deletable}>
                      <IconButton
                        size="sm"
                        variant="outline"
                        color="error"
                        label={t("options.ignored_debug.delete")}
                        onClick={() => handleRemove(item)}
                        icon={<HugeiconsIcon icon={Delete02Icon} size={16} strokeWidth={2} />}
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
  );
};
