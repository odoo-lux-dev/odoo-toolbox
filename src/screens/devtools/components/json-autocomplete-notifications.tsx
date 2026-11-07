import { For, Show, type JSX } from "solid-js";

import { t } from "@/services/i18n-service";
import type { ActionButton } from "@/utils/notifications";

const FieldListMessage = (props: { title: string; fields: string[]; hint: string }) => (
  <div class="flex flex-col gap-2 text-sm text-base-content">
    <div class="font-semibold">
      <strong>{props.title}</strong>
    </div>
    <div class="flex flex-wrap gap-1">
      <For each={props.fields}>
        {(field, index) => (
          <span class="inline-flex items-center">
            <code class="rounded-sm bg-base-200 px-1.5 py-0.5 font-mono text-ui text-error">
              "{field}"
            </code>
            <Show when={index() < props.fields.length - 1}>, </Show>
          </span>
        )}
      </For>
    </div>
    <div class="text-ui text-base-content/70 italic">{props.hint}</div>
  </div>
);

export const createFieldValidationErrorNotification = (invalidFields: string[]): JSX.Element => (
  <FieldListMessage
    title={
      invalidFields.length > 1
        ? t("devtools.notifications.invalid_fields_plural", [invalidFields.length])
        : t("devtools.notifications.invalid_fields")
    }
    fields={invalidFields}
    hint={t("devtools.notifications.invalid_fields_hint")}
  />
);

export const createRequiredFieldsActionNotification = (
  missingFields: string[],
  onAddFields: () => void,
): { message: JSX.Element; actionButton: ActionButton } => {
  const isPlural = missingFields.length > 1;
  return {
    message: (
      <FieldListMessage
        title={
          isPlural
            ? t("devtools.notifications.required_missing_plural", [missingFields.length])
            : t("devtools.notifications.required_missing")
        }
        fields={missingFields}
        hint={t("devtools.notifications.required_missing_hint")}
      />
    ),
    actionButton: {
      label: isPlural
        ? t("devtools.notifications.add_required_plural")
        : t("devtools.notifications.add_required"),
      variant: "secondary-outline",
      icon: "➕",
      action: onAddFields,
      autoClose: true,
    },
  };
};
