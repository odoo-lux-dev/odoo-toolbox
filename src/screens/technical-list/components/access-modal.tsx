import {
  ArrowUpRight01Icon,
  Cancel01Icon,
  Key01Icon,
  Shield02Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { createEffect, createSignal, For, Show } from "solid-js";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Modal } from "@/components/ui/modal";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import {
  getGroupNames,
  getModelAccessRights,
  getModelRecordRules,
  openViewWithIds,
} from "@/services/content-script-rpc-service";
import type { ModelAccessRight, ModelRecordRule } from "@/types";
import { t } from "@/utils/i18n-page";

interface AccessModalProps {
  open: boolean;
  onClose: () => void;
  model: string;
}

const useColumnResize = (defaults: number[]) => {
  const [widths, setWidths] = createSignal<number[]>([...defaults]);

  const startResize = (index: number, e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = widths()[index];

    const onMove = (ev: MouseEvent) => {
      const newWidth = Math.max(40, startWidth + ev.clientX - startX);
      setWidths((prev) => {
        const next = [...prev];
        next[index] = newWidth;
        return next;
      });
    };

    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.userSelect = "";
    };

    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  return { widths, startResize };
};

const extractGroupIds = (rights: ModelAccessRight[], rules: ModelRecordRule[]): number[] => {
  const ids = new Set<number>();
  for (const right of rights) {
    if (Array.isArray(right.group_id) && right.group_id.length > 0) {
      ids.add(right.group_id[0]);
    } else if (typeof right.group_id === "number") {
      ids.add(right.group_id);
    }
  }
  for (const rule of rules) {
    if (Array.isArray(rule.groups)) {
      for (const g of rule.groups) {
        if (Array.isArray(g) && g.length > 0) {
          ids.add(g[0]);
        } else if (typeof g === "number") {
          ids.add(g);
        }
      }
    }
  }
  return [...ids];
};

const formatGroupId = (groupId: unknown, namesMap: Record<number, string>): string => {
  if (!groupId) return t("technical_list.model_actions.all_groups");
  if (Array.isArray(groupId)) {
    return namesMap[groupId[0]] ?? String(groupId[1] ?? groupId[0] ?? "");
  }
  if (typeof groupId === "number") {
    return namesMap[groupId] ?? String(groupId);
  }
  return String(groupId);
};

const formatGroups = (groups: unknown, namesMap: Record<number, string>): string => {
  if (!Array.isArray(groups) || groups.length === 0)
    return t("technical_list.model_actions.global");
  return groups
    .map((g) => {
      if (Array.isArray(g)) {
        return namesMap[g[0]] ?? String(g[1] ?? g[0] ?? "");
      }
      if (typeof g === "number") {
        return namesMap[g] ?? String(g);
      }
      return String(g);
    })
    .join(", ");
};

const formatDomain = (domain: unknown): string => {
  if (!domain) return t("technical_list.model_actions.no_domain");
  return String(domain);
};

const PermissionIcon = (props: { granted: boolean }) => (
  <span
    class={props.granted ? "text-success" : "text-base-content/30"}
    title={
      props.granted
        ? t("technical_list.model_actions.granted")
        : t("technical_list.model_actions.not_granted")
    }
  >
    <HugeiconsIcon
      icon={props.granted ? Tick02Icon : Cancel01Icon}
      size={14}
      color="currentColor"
      strokeWidth={2}
    />
  </span>
);

const PermissionBadge = (props: { label: string; name: string; granted: boolean }) => (
  <span
    class={`flex items-center gap-0.5 select-none ${props.granted ? "text-success" : "text-base-content/30"}`}
    title={`${props.name}: ${props.granted ? t("technical_list.model_actions.granted") : t("technical_list.model_actions.not_granted")}`}
  >
    <span class="text-xs font-medium">{props.label}</span>
    <HugeiconsIcon
      icon={props.granted ? Tick02Icon : Cancel01Icon}
      size={12}
      color="currentColor"
      strokeWidth={2}
    />
  </span>
);

const ResizeHandle = (props: { onResize: (e: MouseEvent) => void }) => (
  <div
    class="absolute inset-y-0 inset-e-0 w-1 cursor-col-resize hover:bg-base-300"
    onMouseDown={props.onResize}
  />
);

export const AccessModal = (props: AccessModalProps) => {
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [accessRights, setAccessRights] = createSignal<ModelAccessRight[]>([]);
  const [recordRules, setRecordRules] = createSignal<ModelRecordRule[]>([]);
  const [groupNames, setGroupNames] = createSignal<Record<number, string>>({});

  const { copyToClipboard } = useCopyToClipboard();

  const accessCols = useColumnResize([180, 50, 50, 50, 50]);

  createEffect(() => {
    if (props.open && props.model) {
      fetchData(props.model);
    }
  });

  const fetchData = async (model: string) => {
    setLoading(true);
    setError(null);
    setAccessRights([]);
    setRecordRules([]);
    setGroupNames({});
    try {
      const [rights, rules] = await Promise.all([
        getModelAccessRights(model),
        getModelRecordRules(model),
      ]);
      setAccessRights(rights);
      setRecordRules(rules);

      const groupIds = extractGroupIds(rights, rules);
      if (groupIds.length > 0) {
        const names = await getGroupNames(groupIds);
        setGroupNames(names);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleMoreDetailsAccess = async () => {
    const ids = accessRights().map((r) => r.id);
    await openViewWithIds(
      "ir.model.access",
      ids,
      t("technical_list.model_actions.view_title_access", [props.model]),
    );
  };

  const handleMoreDetailsRules = async () => {
    const ids = recordRules().map((r) => r.id);
    await openViewWithIds(
      "ir.rule",
      ids,
      t("technical_list.model_actions.view_title_rules", [props.model]),
    );
  };

  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title={t("technical_list.model_actions.access_modal_title", [props.model])}
      size="xl"
      boxClass="max-w-[900px]"
    >
      <div class="mt-3 max-h-[70vh] overflow-auto">
        <Show
          when={!loading()}
          fallback={
            <Alert color="info" variant="outline" class="items-start">
              <span class="text-sm">{t("technical_list.model_actions.loading_access")}</span>
            </Alert>
          }
        >
          <Show
            when={!error()}
            fallback={
              <Alert color="error" variant="outline" class="items-start">
                <span class="text-sm">{error()}</span>
              </Alert>
            }
          >
            <div class="space-y-6">
              <section>
                <div class="mb-2 flex items-center justify-between">
                  <h4 class="flex items-center gap-1.5 text-sm font-semibold">
                    <HugeiconsIcon
                      icon={Key01Icon}
                      size={16}
                      color="currentColor"
                      strokeWidth={1.6}
                    />
                    {t("technical_list.model_actions.access_rights")}
                  </h4>
                  <Show when={accessRights().length > 0}>
                    <Button
                      variant="ghost"
                      size="xs"
                      class="gap-1 text-xs"
                      onClick={handleMoreDetailsAccess}
                    >
                      {t("technical_list.model_actions.more_details")}
                      <HugeiconsIcon
                        icon={ArrowUpRight01Icon}
                        size={12}
                        color="currentColor"
                        strokeWidth={1.8}
                      />
                    </Button>
                  </Show>
                </div>
                <Show
                  when={accessRights().length > 0}
                  fallback={
                    <p class="text-xs opacity-60">
                      {t("technical_list.model_actions.no_access_rights")}
                    </p>
                  }
                >
                  <div class="overflow-x-auto rounded-lg border border-base-300">
                    <table class="table table-xs" style={{ "table-layout": "fixed" }}>
                      <colgroup>
                        <For each={accessCols.widths()}>
                          {(w) => <col style={{ width: `${w}px` }} />}
                        </For>
                      </colgroup>
                      <thead>
                        <tr>
                          <th class="relative">
                            {t("technical_list.model_actions.group")}
                            <ResizeHandle onResize={(e) => accessCols.startResize(0, e)} />
                          </th>
                          <th class="relative text-center">
                            {t("technical_list.model_actions.create")}
                            <ResizeHandle onResize={(e) => accessCols.startResize(1, e)} />
                          </th>
                          <th class="relative text-center">
                            {t("technical_list.model_actions.read")}
                            <ResizeHandle onResize={(e) => accessCols.startResize(2, e)} />
                          </th>
                          <th class="relative text-center">
                            {t("technical_list.model_actions.write")}
                            <ResizeHandle onResize={(e) => accessCols.startResize(3, e)} />
                          </th>
                          <th class="relative text-center">
                            {t("technical_list.model_actions.delete")}
                            <ResizeHandle onResize={(e) => accessCols.startResize(4, e)} />
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <For each={accessRights()}>
                          {(right) => {
                            const groupName = () => formatGroupId(right.group_id, groupNames());
                            return (
                              <tr>
                                <td class="truncate" title={groupName()}>
                                  {groupName()}
                                </td>
                                <td class="text-center">
                                  <PermissionIcon granted={right.perm_create} />
                                </td>
                                <td class="text-center">
                                  <PermissionIcon granted={right.perm_read} />
                                </td>
                                <td class="text-center">
                                  <PermissionIcon granted={right.perm_write} />
                                </td>
                                <td class="text-center">
                                  <PermissionIcon granted={right.perm_unlink} />
                                </td>
                              </tr>
                            );
                          }}
                        </For>
                      </tbody>
                    </table>
                  </div>
                </Show>
              </section>

              <section>
                <div class="mb-2 flex items-center justify-between">
                  <h4 class="flex items-center gap-1.5 text-sm font-semibold">
                    <HugeiconsIcon
                      icon={Shield02Icon}
                      size={16}
                      color="currentColor"
                      strokeWidth={1.6}
                    />
                    {t("technical_list.model_actions.record_rules")}
                  </h4>
                  <Show when={recordRules().length > 0}>
                    <Button
                      variant="ghost"
                      size="xs"
                      class="gap-1 text-xs"
                      onClick={handleMoreDetailsRules}
                    >
                      {t("technical_list.model_actions.more_details")}
                      <HugeiconsIcon
                        icon={ArrowUpRight01Icon}
                        size={12}
                        color="currentColor"
                        strokeWidth={1.8}
                      />
                    </Button>
                  </Show>
                </div>
                <Show
                  when={recordRules().length > 0}
                  fallback={
                    <p class="text-xs opacity-60">
                      {t("technical_list.model_actions.no_record_rules")}
                    </p>
                  }
                >
                  <div class="space-y-2">
                    <For each={recordRules()}>
                      {(rule) => {
                        const groupsText = () => formatGroups(rule.groups, groupNames());
                        const domainText = () => formatDomain(rule.domain_force);
                        const handleCopyDomain = (event: MouseEvent) => {
                          if (!rule.domain_force) return;
                          copyToClipboard(
                            String(rule.domain_force),
                            event.currentTarget as HTMLElement,
                          );
                        };
                        return (
                          <div class="rounded-lg border border-base-300 p-3">
                            <div class="flex items-start justify-between gap-2">
                              <span class="text-sm font-medium">{rule.name}</span>
                              <div class="flex shrink-0 gap-2">
                                <PermissionBadge
                                  label="C"
                                  name={t("technical_list.model_actions.create")}
                                  granted={rule.perm_create}
                                />
                                <PermissionBadge
                                  label="R"
                                  name={t("technical_list.model_actions.read")}
                                  granted={rule.perm_read}
                                />
                                <PermissionBadge
                                  label="W"
                                  name={t("technical_list.model_actions.write")}
                                  granted={rule.perm_write}
                                />
                                <PermissionBadge
                                  label="D"
                                  name={t("technical_list.model_actions.delete")}
                                  granted={rule.perm_unlink}
                                />
                              </div>
                            </div>
                            <div class="mt-2 space-y-1 text-xs">
                              <div>
                                <span class="opacity-60">
                                  {t("technical_list.model_actions.groups")}:
                                </span>{" "}
                                {groupsText()}
                              </div>
                              <div>
                                <span class="opacity-60">
                                  {t("technical_list.model_actions.domain")}:
                                </span>{" "}
                                <code
                                  class="rounded-sm bg-base-200/60 px-1 break-all transition-colors"
                                  classList={{
                                    "cursor-pointer hover:bg-primary hover:text-primary-content":
                                      !!rule.domain_force,
                                  }}
                                  onClick={rule.domain_force ? handleCopyDomain : undefined}
                                  title={
                                    rule.domain_force
                                      ? t("technical_list.info_item.click_to_copy")
                                      : undefined
                                  }
                                >
                                  {domainText()}
                                </code>
                              </div>
                            </div>
                          </div>
                        );
                      }}
                    </For>
                  </div>
                </Show>
              </section>
            </div>
          </Show>
        </Show>
      </div>
    </Modal>
  );
};
