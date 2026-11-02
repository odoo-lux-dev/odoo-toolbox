import { type JSX } from "solid-js";

import type { ActionButton } from "@/utils/notifications";

export const createFieldValidationErrorNotification = (invalidFields: string[]): JSX.Element => {
  const fieldCount = invalidFields.length;
  const isPlural = fieldCount > 1;

  return (
    <div class="flex flex-col gap-2 text-sm text-base-content">
      <div class="font-semibold">
        <strong>
          {isPlural ? `${fieldCount} invalid fields detected:` : "Invalid field detected:"}
        </strong>
      </div>
      <div class="flex flex-wrap gap-1">
        {invalidFields.map((field, index) => (
          <span class="inline-flex items-center">
            <code class="rounded-sm bg-base-200 px-1.5 py-0.5 font-mono text-[11px] text-error">
              "{field}"
            </code>
            {index < invalidFields.length - 1 && ", "}
          </span>
        ))}
      </div>
      <div class="text-xs text-base-content/70 italic">
        💡 Use the autocomplete suggestions or check the model fields
      </div>
    </div>
  );
};

export const createRequiredFieldsActionNotification = (
  missingFields: string[],
  onAddFields: () => void,
): {
  message: JSX.Element;
  actionButton: ActionButton;
} => {
  const fieldCount = missingFields.length;
  const isPlural = fieldCount > 1;

  const message = (
    <div class="flex flex-col gap-2 text-sm text-base-content">
      <div class="font-semibold">
        <strong>
          {isPlural ? `${fieldCount} required fields missing:` : "Required field missing:"}
        </strong>
      </div>
      <div class="flex flex-wrap gap-1">
        {missingFields.map((field, index) => (
          <span class="inline-flex items-center">
            <code class="rounded-sm bg-base-200 px-1.5 py-0.5 font-mono text-[11px] text-error">
              "{field}"
            </code>
            {index < missingFields.length - 1 && ", "}
          </span>
        ))}
      </div>
      <div class="text-xs text-base-content/70 italic">
        💡 Click below to add these fields with default values
      </div>
    </div>
  );

  const actionButton: ActionButton = {
    label: isPlural ? "Add Required Fields" : "Add Required Field",
    variant: "secondary-outline",
    icon: "➕",
    action: onAddFields,
    autoClose: true,
  };

  return { message, actionButton };
};
