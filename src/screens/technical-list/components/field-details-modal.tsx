import { createResource, For, Show, type JSX } from "solid-js";

import { getFieldDetails, getGroupNames } from "@/services/content-script-rpc-service";
import { t } from "@/utils/i18n-page";

import { useSidebar, type FieldDetailsTarget } from "../sidebar-store";
import { AsyncModal } from "./async-modal";
import {
  CopyValue,
  DetailRow,
  EmptyValue,
  Flag,
  OptionalCopyValue,
  formatGroups,
} from "./detail-parts";

const loadFieldDetails = async ({ model, fieldName }: FieldDetailsTarget) => {
  const details = await getFieldDetails(model, fieldName);
  if (!details) throw new Error(t("technical_list.field_details.not_found"));
  return { details, groupNames: await getGroupNames(details.groups) };
};

const COMPUTE_ROWS = [
  { key: "compute", label: () => t("technical_list.field_details.compute") },
  { key: "depends", label: () => t("technical_list.field_details.depends") },
  { key: "related", label: () => t("technical_list.field_details.related") },
] as const;

const FLAG_ROWS = [
  { key: "store", label: () => t("technical_list.field_details.stored") },
  { key: "index", label: () => t("technical_list.field_details.indexed") },
  { key: "translate", label: () => t("technical_list.field_details.translatable") },
  { key: "copied", label: () => t("technical_list.field_details.copied") },
] as const;

const TextValue = (props: { value: unknown }) => (
  <Show when={props.value} fallback={<EmptyValue />}>
    {String(props.value)}
  </Show>
);

const Group = (props: { children: JSX.Element }) => (
  <section class="border-t border-base-300 pt-3 first:border-t-0 first:pt-0">
    {props.children}
  </section>
);

/** Details (`ir.model.fields`) of the field opened from a panel card. */
export const FieldDetailsModal = () => {
  const sidebar = useSidebar();
  const [data] = createResource(sidebar.fieldDetails, loadFieldDetails);

  return (
    <AsyncModal
      open={!!sidebar.fieldDetails()}
      onClose={sidebar.closeFieldDetails}
      title={t("technical_list.field_details.title", [sidebar.fieldDetails()?.fieldName ?? ""])}
      size="lg"
      boxClass="max-w-[700px]"
      loadingLabel={t("technical_list.field_details.loading")}
      data={data}
    >
      {({ details, groupNames }) => (
        <div class="space-y-4">
          <Group>
            <DetailRow label={t("technical_list.field_details.model")}>
              <CopyValue value={sidebar.fieldDetails()?.model ?? ""} />
            </DetailRow>
            <DetailRow label={t("technical_list.field_details.name")}>
              <CopyValue value={details.name} />
            </DetailRow>
            <DetailRow label={t("technical_list.field_details.label")}>
              <TextValue value={details.field_description} />
            </DetailRow>
            <DetailRow label={t("technical_list.field_details.type")}>
              <TextValue value={details.ttype} />
            </DetailRow>
            <Show when={details.help}>
              <DetailRow label={t("technical_list.field_details.help")}>
                <span class="text-xs italic">{details.help}</span>
              </DetailRow>
            </Show>
            <Show when={details.size}>
              <DetailRow label={t("technical_list.field_details.size")}>
                <TextValue value={details.size} />
              </DetailRow>
            </Show>
          </Group>

          <Show when={details.relation || details.relation_field}>
            <Group>
              <DetailRow label={t("technical_list.field_details.relation")}>
                <OptionalCopyValue value={details.relation} />
              </DetailRow>
              <Show when={details.relation_field}>
                <DetailRow label={t("technical_list.field_details.relation_field")}>
                  <TextValue value={details.relation_field} />
                </DetailRow>
              </Show>
              <DetailRow label={t("technical_list.field_details.domain")}>
                <OptionalCopyValue value={details.domain} />
              </DetailRow>
            </Group>
          </Show>

          <Show when={details.compute || details.depends || details.related}>
            <Group>
              <For each={COMPUTE_ROWS.filter((row) => details[row.key])}>
                {(row) => (
                  <DetailRow label={row.label()}>
                    <CopyValue value={details[row.key] as string} />
                  </DetailRow>
                )}
              </For>
            </Group>
          </Show>

          <Group>
            <For each={FLAG_ROWS}>
              {(row) => (
                <DetailRow label={row.label()}>
                  <Flag value={details[row.key]} />
                </DetailRow>
              )}
            </For>
            <Show when={details.on_delete}>
              <DetailRow label={t("technical_list.field_details.on_delete")}>
                <TextValue value={details.on_delete} />
              </DetailRow>
            </Show>
          </Group>

          <Group>
            <DetailRow label={t("technical_list.field_details.required")}>
              <Flag value={details.required} />
            </DetailRow>
            <DetailRow label={t("technical_list.field_details.readonly")}>
              <Flag value={details.readonly} />
            </DetailRow>
            <DetailRow label={t("technical_list.field_details.groups")}>
              <span class="text-xs">
                {details.groups.length > 0 ? formatGroups(details.groups, groupNames) : "-"}
              </span>
            </DetailRow>
          </Group>

          <Group>
            <DetailRow label={t("technical_list.field_details.modules")}>
              <Show when={details.modules} fallback={<EmptyValue />}>
                {(modules) => (
                  <div class="flex flex-wrap justify-end gap-1">
                    <For
                      each={modules()
                        .split(",")
                        .map((m) => m.trim())
                        .filter(Boolean)}
                    >
                      {(module) => <CopyValue value={module} />}
                    </For>
                  </div>
                )}
              </Show>
            </DetailRow>
            <DetailRow label={t("technical_list.field_details.id")}>
              <TextValue value={details.id} />
            </DetailRow>
          </Group>
        </div>
      )}
    </AsyncModal>
  );
};
