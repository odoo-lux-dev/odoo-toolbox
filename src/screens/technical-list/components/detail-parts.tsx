import { Cancel01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { For, Show, type JSX } from "solid-js";

import { HugeiconsIcon, type IconData } from "@/components/ui/hugeicons-icon";
import { copyWithFeedback } from "@/utils/clipboard";
import { t } from "@/utils/i18n-page";

export const DetailRow = (props: { label: string; children: JSX.Element }) => (
  <div class="flex items-start justify-between gap-4 py-0.5">
    <span class="text-xs font-medium whitespace-nowrap text-base-content/60">{props.label}</span>
    <div class="text-end text-xs text-base-content/80">{props.children}</div>
  </div>
);

export const EmptyValue = () => <span class="text-base-content/30">—</span>;

/** Wrapping mono value copied on click (domains, XML ids...). */
export const CopyValue = (props: { value: string }) => {
  return (
    <code
      class="cursor-pointer rounded-sm bg-base-200/60 px-1 break-all transition-colors hover:bg-primary hover:text-primary-content"
      onClick={(event) => copyWithFeedback(props.value, event.currentTarget)}
      title={t("technical_list.info_item.click_to_copy")}
    >
      {props.value}
    </code>
  );
};

/** Copyable value, or a placeholder when missing. */
export const OptionalCopyValue = (props: { value: string | false | null | undefined }) => (
  <Show when={props.value} fallback={<EmptyValue />}>
    {(value) => <CopyValue value={value()} />}
  </Show>
);

const grantedLabel = (granted: boolean) =>
  granted
    ? t("technical_list.model_actions.granted")
    : t("technical_list.model_actions.not_granted");

export const Flag = (props: { value: boolean; size?: number; title?: string }) => (
  <span class={props.value ? "text-success" : "text-base-content/30"} title={props.title}>
    <HugeiconsIcon
      icon={props.value ? Tick02Icon : Cancel01Icon}
      size={props.size ?? 14}
      strokeWidth={2}
    />
  </span>
);

export interface CrudPermissions {
  create: boolean;
  read: boolean;
  write: boolean;
  unlink: boolean;
}

export const CRUD_COLUMNS = [
  { key: "create", letter: "C", label: () => t("technical_list.model_actions.create") },
  { key: "read", letter: "R", label: () => t("technical_list.model_actions.read") },
  { key: "write", letter: "W", label: () => t("technical_list.model_actions.write") },
  { key: "unlink", letter: "D", label: () => t("technical_list.model_actions.delete") },
] as const;

export const permissionTitle = (name: string, granted: boolean) =>
  `${name}: ${grantedLabel(granted)}`;

export const CrudBadges = (props: { permissions: CrudPermissions }) => (
  <div class="flex shrink-0 gap-2">
    <For each={CRUD_COLUMNS}>
      {(column) => (
        <span
          class={`flex items-center gap-0.5 select-none ${props.permissions[column.key] ? "text-success" : "text-base-content/30"}`}
          title={permissionTitle(column.label(), props.permissions[column.key])}
        >
          <span class="text-xs font-medium">{column.letter}</span>
          <Flag value={props.permissions[column.key]} size={12} />
        </span>
      )}
    </For>
  </div>
);

export const SectionTitle = (props: { icon: IconData; title: string; aside?: JSX.Element }) => (
  <div class="mb-2 flex items-center justify-between">
    <h4 class="flex items-center gap-1.5 text-sm font-semibold">
      <HugeiconsIcon icon={props.icon} size={16} strokeWidth={1.6} />
      {props.title}
    </h4>
    {props.aside}
  </div>
);

/** Names of `res.groups` ids, falling back to the id. */
export const formatGroups = (ids: number[], names: Record<number, string>) =>
  ids.map((id) => names[id] ?? String(id)).join(", ");
