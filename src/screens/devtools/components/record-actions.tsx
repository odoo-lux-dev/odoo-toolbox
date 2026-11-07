import {
  Alert01Icon,
  ArrowUpRight01Icon,
  CenterFocusIcon,
  Layers02Icon,
} from "@hugeicons/core-free-icons";
import { For, Show } from "solid-js";

import { IconButton } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { focusRecord } from "@/screens/devtools/devtools-signals";
import { t } from "@/services/i18n-service";
import { Logger } from "@/services/logger";
import { odooRpcService } from "@/services/odoo-rpc-service";

/** Opens records in the Odoo tab (a single id opens the form view). */
export const openRecords = async (model: string, ids: number[], asPopup = false) => {
  if (!model || ids.length === 0) return;
  try {
    await odooRpcService.openView({
      model,
      recordIds: ids.length === 1 ? ids[0] : ids,
      asPopup,
    });
  } catch (error) {
    Logger.error("Failed to open records:", error);
  }
};

/** Shows records in the rail query of the DevTools. */
export const focusRecords = async (model: string, ids: number[]) => {
  if (!model || ids.length === 0) return;
  try {
    await focusRecord(model, ids.length === 1 ? ids[0] : ids);
  } catch (error) {
    Logger.error("Failed to focus records:", error);
  }
};

const ACTIONS = [
  {
    label: "devtools.field_rendering.focus_record",
    icon: CenterFocusIcon,
    hover: "hover:text-info",
    run: (model: string, ids: number[]) => focusRecords(model, ids),
  },
  {
    label: "devtools.field_rendering.open_in_odoo",
    icon: ArrowUpRight01Icon,
    hover: "hover:text-primary",
    run: (model: string, ids: number[]) => openRecords(model, ids, false),
  },
  {
    label: "devtools.field_rendering.open_in_popup",
    icon: Layers02Icon,
    hover: "hover:text-warning",
    run: (model: string, ids: number[]) => openRecords(model, ids, true),
  },
];

/**
 * Focus / open / open in popup buttons of a record row or relational field, preceded by a
 * warning when the model has fields the queries never fetch.
 */
export const RecordActionButtons = (props: {
  model: string;
  ids: number[];
  size: "xs" | "sm";
  showExcludedFields?: boolean;
}) => {
  const excludedFields = () => odooRpcService.getExcludedFieldsConfig()[props.model] ?? [];
  const iconSize = () => (props.size === "xs" ? 14 : 16);

  return (
    <div class="ms-auto flex shrink-0 flex-nowrap items-center gap-0.5">
      <Show when={props.showExcludedFields && excludedFields().length > 0}>
        <span
          class="inline-flex items-center text-warning"
          title={t("devtools.field_rendering.excluded_fields", [
            props.model,
            excludedFields().join(", "),
          ])}
        >
          <HugeiconsIcon icon={Alert01Icon} size={iconSize() - 2} strokeWidth={1.6} />
        </span>
      </Show>
      <For each={ACTIONS}>
        {(action) => (
          <IconButton
            label={t(action.label)}
            variant="ghost"
            size={props.size}
            square
            class={`text-ink-3 ${action.hover}`}
            onClick={(event) => {
              event.stopPropagation();
              action.run(props.model, props.ids);
            }}
            icon={<HugeiconsIcon icon={action.icon} size={iconSize()} strokeWidth={1.6} />}
          />
        )}
      </For>
    </div>
  );
};
