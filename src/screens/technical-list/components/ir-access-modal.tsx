import {
  ArrowUpRight01Icon,
  Cancel01Icon,
  CheckmarkBadge02Icon,
  Shield02Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { createEffect, createSignal, For, Show } from "solid-js";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Modal } from "@/components/ui/modal";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { getGroupNames, getIrAccess, openViewWithDomain } from "@/services/content-script-rpc-service";
import type { IrAccess } from "@/types";
import { t } from "@/utils/i18n-page";

interface IrAccessModalProps {
  open: boolean;
  onClose: () => void;
  model: string;
}

const extractGroupIds = (accesses: IrAccess[]): number[] => {
  const ids = new Set<number>();
  for (const a of accesses) {
    if (Array.isArray(a.group_id) && a.group_id.length > 0) {
      ids.add(a.group_id[0]);
    }
  }
  return [...ids];
};

const formatGroupId = (groupId: IrAccess["group_id"], namesMap: Record<number, string>): string => {
  if (!groupId) return t("technical_list.model_actions.global");
  if (Array.isArray(groupId)) {
    return namesMap[groupId[0]] ?? String(groupId[1] ?? groupId[0] ?? "");
  }
  return String(groupId);
};

const formatDomain = (domain: string | false): string => {
  if (!domain) return t("technical_list.model_actions.no_domain");
  return String(domain);
};

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

export const IrAccessModal = (props: IrAccessModalProps) => {
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [accesses, setAccesses] = createSignal<IrAccess[]>([]);
  const [groupNames, setGroupNames] = createSignal<Record<number, string>>({});

  const { copyToClipboard } = useCopyToClipboard();

  const permissions = () => accesses().filter((a) => a.group_id);
  const restrictions = () => accesses().filter((a) => !a.group_id);

  createEffect(() => {
    if (props.open && props.model) {
      fetchData(props.model);
    }
  });

  const fetchData = async (model: string) => {
    setLoading(true);
    setError(null);
    setAccesses([]);
    setGroupNames({});
    try {
      const result = await getIrAccess(model);
      setAccesses(result);

      const groupIds = extractGroupIds(result);
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

  const handleMoreDetailsPermissions = async () => {
    await openViewWithDomain(
      "ir.access",
      [["model_id.model", "=", props.model], ["kind", "=", "permission"]],
      t("technical_list.model_actions.view_title_permissions", [props.model]),
    );
  };

  const handleMoreDetailsRestrictions = async () => {
    await openViewWithDomain(
      "ir.access",
      [["model_id.model", "=", props.model], ["kind", "=", "restriction"]],
      t("technical_list.model_actions.view_title_restrictions", [props.model]),
    );
  };

  const renderAccessCard = (access: IrAccess) => {
    const groupName = () => formatGroupId(access.group_id, groupNames());
    const domainText = () => formatDomain(access.domain);
    const handleCopyDomain = (event: MouseEvent) => {
      if (!access.domain) return;
      copyToClipboard(String(access.domain), event.currentTarget as HTMLElement);
    };
    return (
      <div class="rounded-lg border border-base-300 p-3">
        <div class="flex items-start justify-between gap-2">
          <span class="text-sm font-medium">{access.name}</span>
          <div class="flex shrink-0 gap-2">
            <PermissionBadge
              label="C"
              name={t("technical_list.model_actions.create")}
              granted={access.for_create}
            />
            <PermissionBadge
              label="R"
              name={t("technical_list.model_actions.read")}
              granted={access.for_read}
            />
            <PermissionBadge
              label="W"
              name={t("technical_list.model_actions.write")}
              granted={access.for_write}
            />
            <PermissionBadge
              label="D"
              name={t("technical_list.model_actions.delete")}
              granted={access.for_unlink}
            />
          </div>
        </div>
        <div class="mt-2 space-y-1 text-xs">
          <Show when={access.group_id}>
            <div>
              <span class="opacity-60">{t("technical_list.model_actions.group")}:</span>{" "}
              {groupName()}
            </div>
          </Show>
          <div>
            <span class="opacity-60">{t("technical_list.model_actions.domain")}:</span>{" "}
            <code
              class="rounded-sm bg-base-200/60 px-1 break-all transition-colors"
              classList={{
                "cursor-pointer hover:bg-primary hover:text-primary-content": !!access.domain,
              }}
              onClick={access.domain ? handleCopyDomain : undefined}
              title={access.domain ? t("technical_list.info_item.click_to_copy") : undefined}
            >
              {domainText()}
            </code>
          </div>
        </div>
      </div>
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
                      icon={CheckmarkBadge02Icon}
                      size={16}
                      color="currentColor"
                      strokeWidth={1.6}
                    />
                    {t("technical_list.model_actions.permissions")}
                  </h4>
                  <Show when={permissions().length > 0}>
                    <Button
                      variant="ghost"
                      size="xs"
                      class="gap-1 text-xs"
                      onClick={handleMoreDetailsPermissions}
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
                <p class="mb-2 text-xs opacity-50">
                  {t("technical_list.model_actions.permissions_desc")}
                </p>
                <Show
                  when={permissions().length > 0}
                  fallback={
                    <p class="text-xs opacity-60">
                      {t("technical_list.model_actions.no_permissions")}
                    </p>
                  }
                >
                  <div class="space-y-2">
                    <For each={permissions()}>{(access) => renderAccessCard(access)}</For>
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
                    {t("technical_list.model_actions.restrictions")}
                  </h4>
                  <Show when={restrictions().length > 0}>
                    <Button
                      variant="ghost"
                      size="xs"
                      class="gap-1 text-xs"
                      onClick={handleMoreDetailsRestrictions}
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
                <p class="mb-2 text-xs opacity-50">
                  {t("technical_list.model_actions.restrictions_desc")}
                </p>
                <Show
                  when={restrictions().length > 0}
                  fallback={
                    <p class="text-xs opacity-60">
                      {t("technical_list.model_actions.no_restrictions")}
                    </p>
                  }
                >
                  <div class="space-y-2">
                    <For each={restrictions()}>{(access) => renderAccessCard(access)}</For>
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
