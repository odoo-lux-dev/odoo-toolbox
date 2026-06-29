import { Cancel01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { createEffect, createSignal, For, Show, type JSX } from "solid-js";

import { Alert } from "@/components/ui/alert";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Modal } from "@/components/ui/modal";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { getFieldDetails, getGroupNames } from "@/services/content-script-rpc-service";
import type { FieldDetails } from "@/types";
import { t } from "@/utils/i18n-page";

interface FieldDetailsModalProps {
  open: boolean;
  onClose: () => void;
  model: string;
  fieldName: string;
}

const DetailRow = (props: { label: string; children: JSX.Element }) => (
  <div class="flex items-start justify-between gap-4 py-1">
    <span class="text-xs font-medium whitespace-nowrap text-base-content/60">{props.label}</span>
    <div class="text-end text-xs text-base-content/80">{props.children}</div>
  </div>
);

const CopyableValue = (props: {
  value: string;
  onCopy: (value: string, e: MouseEvent) => void;
}) => (
  <code
    class="cursor-pointer rounded-sm bg-base-200/60 px-1 break-all transition-colors hover:bg-primary hover:text-primary-content"
    onClick={(e) => props.onCopy(props.value, e)}
    title={t("technical_list.info_item.click_to_copy")}
  >
    {props.value}
  </code>
);

const BooleanValue = (props: { value: boolean }) => (
  <span class={props.value ? "text-success" : "text-base-content/30"}>
    <HugeiconsIcon
      icon={props.value ? Tick02Icon : Cancel01Icon}
      size={14}
      color="currentColor"
      strokeWidth={2}
    />
  </span>
);

const EmptyValue = () => <span class="text-base-content/30">-</span>;

const TextValue = (props: { value: unknown }) => (
  <Show when={props.value} fallback={<EmptyValue />}>
    {String(props.value)}
  </Show>
);

export const FieldDetailsModal = (props: FieldDetailsModalProps) => {
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [details, setDetails] = createSignal<FieldDetails | null>(null);
  const [groupNames, setGroupNames] = createSignal<Record<number, string>>({});
  const { copyToClipboard } = useCopyToClipboard();

  const handleCopy = (value: string, e: MouseEvent) => {
    copyToClipboard(value, e.currentTarget as HTMLElement);
  };

  createEffect(() => {
    if (props.open && props.model && props.fieldName) {
      fetchData(props.model, props.fieldName);
    }
  });

  const fetchData = async (model: string, fieldName: string) => {
    setLoading(true);
    setError(null);
    setDetails(null);
    setGroupNames({});
    try {
      const result = await getFieldDetails(model, fieldName);
      if (!result) {
        setError(t("technical_list.field_details.not_found"));
        return;
      }
      setDetails(result);

      if (Array.isArray(result.groups) && result.groups.length > 0) {
        const ids = result.groups
          .map((g) => (Array.isArray(g) ? g[0] : typeof g === "number" ? g : null))
          .filter((id): id is number => id !== null);
        if (ids.length > 0) {
          const names = await getGroupNames(ids);
          setGroupNames(names);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const formatGroupsWithNames = (groups: unknown): string => {
    if (!groups || (Array.isArray(groups) && groups.length === 0)) return "-";
    if (Array.isArray(groups)) {
      return groups
        .map((g) => {
          if (Array.isArray(g)) {
            return groupNames()[g[0]] ?? String(g[1] ?? g[0] ?? "");
          }
          if (typeof g === "number") {
            return groupNames()[g] ?? String(g);
          }
          return String(g);
        })
        .join(", ");
    }
    return String(groups);
  };

  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title={t("technical_list.field_details.title", [props.fieldName])}
      size="lg"
      boxClass="max-w-[700px]"
    >
      <div class="max-h-[70vh] overflow-auto">
        <Show
          when={!loading()}
          fallback={
            <Alert color="info" variant="outline" class="items-start">
              <span class="text-sm">{t("technical_list.field_details.loading")}</span>
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
            <Show when={details()}>
              {(detail) => (
                <div class="mt-3 space-y-4">
                  <section>
                    <DetailRow label={t("technical_list.field_details.model")}>
                      <CopyableValue value={props.model} onCopy={handleCopy} />
                    </DetailRow>
                    <DetailRow label={t("technical_list.field_details.name")}>
                      <CopyableValue value={detail().name} onCopy={handleCopy} />
                    </DetailRow>
                    <DetailRow label={t("technical_list.field_details.label")}>
                      <TextValue value={detail().field_description} />
                    </DetailRow>
                    <DetailRow label={t("technical_list.field_details.type")}>
                      <TextValue value={detail().ttype} />
                    </DetailRow>
                    <Show when={detail().help}>
                      <DetailRow label={t("technical_list.field_details.help")}>
                        <span class="text-xs italic">{detail().help}</span>
                      </DetailRow>
                    </Show>
                    <Show when={detail().size}>
                      <DetailRow label={t("technical_list.field_details.size")}>
                        <TextValue value={detail().size} />
                      </DetailRow>
                    </Show>
                  </section>

                  <Show when={detail().relation || detail().relation_field}>
                    <section class="border-t border-base-300 pt-3">
                      <DetailRow label={t("technical_list.field_details.relation")}>
                        <Show when={detail().relation} fallback={<EmptyValue />}>
                          {(relation) => <CopyableValue value={relation()} onCopy={handleCopy} />}
                        </Show>
                      </DetailRow>
                      <Show when={detail().relation_field}>
                        <DetailRow label={t("technical_list.field_details.relation_field")}>
                          <TextValue value={detail().relation_field} />
                        </DetailRow>
                      </Show>
                      <DetailRow label={t("technical_list.field_details.domain")}>
                        <Show when={detail().domain} fallback={<EmptyValue />}>
                          <CopyableValue value={String(detail().domain)} onCopy={handleCopy} />
                        </Show>
                      </DetailRow>
                    </section>
                  </Show>

                  <Show when={detail().compute || detail().depends || detail().related}>
                    <section class="border-t border-base-300 pt-3">
                      <Show when={detail().compute}>
                        {(compute) => (
                          <DetailRow label={t("technical_list.field_details.compute")}>
                            <CopyableValue value={compute()} onCopy={handleCopy} />
                          </DetailRow>
                        )}
                      </Show>
                      <Show when={detail().depends}>
                        {(depends) => (
                          <DetailRow label={t("technical_list.field_details.depends")}>
                            <CopyableValue value={depends()} onCopy={handleCopy} />
                          </DetailRow>
                        )}
                      </Show>
                      <Show when={detail().related}>
                        {(related) => (
                          <DetailRow label={t("technical_list.field_details.related")}>
                            <CopyableValue value={related()} onCopy={handleCopy} />
                          </DetailRow>
                        )}
                      </Show>
                    </section>
                  </Show>

                  <section class="border-t border-base-300 pt-3">
                    <DetailRow label={t("technical_list.field_details.stored")}>
                      <BooleanValue value={detail().store} />
                    </DetailRow>
                    <DetailRow label={t("technical_list.field_details.indexed")}>
                      <BooleanValue value={detail().index} />
                    </DetailRow>
                    <DetailRow label={t("technical_list.field_details.translatable")}>
                      <BooleanValue value={detail().translate} />
                    </DetailRow>
                    <DetailRow label={t("technical_list.field_details.copied")}>
                      <BooleanValue value={detail().copied} />
                    </DetailRow>
                    <Show when={detail().on_delete}>
                      <DetailRow label={t("technical_list.field_details.on_delete")}>
                        <TextValue value={detail().on_delete} />
                      </DetailRow>
                    </Show>
                  </section>

                  <section class="border-t border-base-300 pt-3">
                    <DetailRow label={t("technical_list.field_details.required")}>
                      <BooleanValue value={detail().required} />
                    </DetailRow>
                    <DetailRow label={t("technical_list.field_details.readonly")}>
                      <BooleanValue value={detail().readonly} />
                    </DetailRow>
                    <DetailRow label={t("technical_list.field_details.groups")}>
                      <span class="text-xs">{formatGroupsWithNames(detail().groups)}</span>
                    </DetailRow>
                  </section>

                  <section class="border-t border-base-300 pt-3">
                    <DetailRow label={t("technical_list.field_details.modules")}>
                      <Show when={detail().modules} fallback={<EmptyValue />}>
                        {(modules) => (
                          <div class="flex flex-wrap justify-end gap-1">
                            <For
                              each={modules()
                                .split(",")
                                .map((m) => m.trim())
                                .filter(Boolean)}
                            >
                              {(module) => <CopyableValue value={module} onCopy={handleCopy} />}
                            </For>
                          </div>
                        )}
                      </Show>
                    </DetailRow>
                    <DetailRow label={t("technical_list.field_details.id")}>
                      <TextValue value={detail().id} />
                    </DetailRow>
                  </section>
                </div>
              )}
            </Show>
          </Show>
        </Show>
      </div>
    </Modal>
  );
};
