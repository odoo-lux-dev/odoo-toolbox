import { createContext, createSignal, useContext, type JSX } from "solid-js";

import { ContextMenu, type ContextMenuItem } from "@/screens/devtools/components/context-menu";
import { focusRecords, openRecords } from "@/screens/devtools/components/record-actions";
import { extractIds } from "@/screens/devtools/components/record-utils";
import { t } from "@/services/i18n-service";
import { Logger } from "@/services/logger";
import { odooRpcService } from "@/services/odoo-rpc-service";
import type { FieldMetadata } from "@/types";
import { copyText } from "@/utils/clipboard";
import { ERROR_NOTIFICATION_TIMEOUT, showNotification } from "@/utils/notifications";

type RecordData = Record<string, unknown>;

/** What was right-clicked: a record row, or one of its fields. */
export type ContextMenuTarget =
  | { kind: "record"; record: RecordData; model: string | undefined }
  | {
      kind: "field";
      record: RecordData;
      model: string | undefined;
      fieldName: string;
      value: unknown;
      metadata: FieldMetadata | null | undefined;
    };

const copy = async (text: string) => {
  if (await copyText(text)) {
    showNotification(t("common.copied_to_clipboard"), "success");
  } else {
    showNotification(t("common.failed_to_copy"), "error", ERROR_NOTIFICATION_TIMEOUT);
  }
};

const title = (label: string): ContextMenuItem => ({
  label,
  action: () => undefined,
  separator: true,
  isTitle: true,
});

const openItems = (model: string, ids: number[]): ContextMenuItem[] => [
  { label: t("devtools.context_menu.open_in_odoo"), action: () => openRecords(model, ids) },
  {
    label: t("devtools.context_menu.open_in_odoo_popup"),
    action: () => openRecords(model, ids, true),
  },
];

const fieldItems = (target: Extract<ContextMenuTarget, { kind: "field" }>): ContextMenuItem[] => {
  const { fieldName, value, metadata } = target;
  const items: ContextMenuItem[] = [
    title(t("devtools.context_menu.field_title", [fieldName])),
    { label: t("devtools.context_menu.copy_field_name"), action: () => copy(fieldName) },
    {
      label: t("devtools.context_menu.copy_field_value"),
      action: () => copy(typeof value === "object" ? JSON.stringify(value) : String(value)),
    },
  ];

  const relation = metadata?.relation;
  const ids = extractIds(value);
  if (!relation || ids.length === 0) return items;

  return [
    ...items,
    {
      label: t("devtools.context_menu.copy_relation_ids", [ids.length]),
      action: () => copy(ids.join(", ")),
    },
    {
      label:
        ids.length > 1
          ? t("devtools.context_menu.copy_records_json")
          : t("devtools.context_menu.copy_record_json"),
      action: async () => {
        try {
          copy(JSON.stringify(await odooRpcService.read(relation, ids), null, 2));
        } catch (error) {
          Logger.error("Failed to read relational records:", error);
        }
      },
      separator: true,
    },
    { label: t("devtools.context_menu.focus_record"), action: () => focusRecords(relation, ids) },
    ...openItems(relation, ids),
  ];
};

const recordItems = (target: Extract<ContextMenuTarget, { kind: "record" }>): ContextMenuItem[] => {
  const { record, model } = target;
  const recordId = record.id as number | undefined;
  const name = record.display_name || record.name;
  const idLabel = recordId ? String(recordId) : t("common.unknown");

  return [
    title(t("devtools.context_menu.record_title", [name ? `${name} - #${idLabel}` : idLabel])),
    ...(recordId
      ? [{ label: t("devtools.context_menu.copy_record_id"), action: () => copy(String(recordId)) }]
      : []),
    {
      label: t("devtools.context_menu.copy_record_json"),
      action: () => copy(JSON.stringify(record, null, 2)),
      separator: Boolean(recordId),
    },
    ...(recordId && model ? openItems(model, [recordId]) : []),
  ];
};

const recordMenuItems = (target: ContextMenuTarget): ContextMenuItem[] =>
  target.kind === "field" ? fieldItems(target) : recordItems(target);

interface RecordContextMenuApi {
  open: (event: MouseEvent, target: ContextMenuTarget) => void;
  /**
   * Handler for a table: the cell under the pointer (`data-field` + `data-row-index`)
   * opens the menu of that field.
   */
  tableHandler: (
    records: () => RecordData[],
    fieldsMetadata: () => Record<string, FieldMetadata> | undefined,
    model: () => string | undefined,
  ) => (event: MouseEvent) => void;
}

const RecordContextMenuContext = createContext<RecordContextMenuApi>();

/** Single context menu shared by every record and field rendered below it. */
export const RecordContextMenuProvider = (props: { children: JSX.Element }) => {
  const [menu, setMenu] = createSignal<{
    position: { x: number; y: number };
    target: ContextMenuTarget;
  } | null>(null);

  const open: RecordContextMenuApi["open"] = (event, target) => {
    event.preventDefault();
    event.stopPropagation();
    setMenu({ position: { x: event.clientX, y: event.clientY }, target });
  };

  const tableHandler: RecordContextMenuApi["tableHandler"] =
    (records, fieldsMetadata, model) => (event) => {
      const cell = (event.target as HTMLElement).closest<HTMLElement>(
        "[data-field][data-row-index]",
      );
      const record = cell && records()[Number(cell.dataset.rowIndex || "0")];
      if (!cell || !record) return;
      const fieldName = cell.dataset.field || "";
      open(event, {
        kind: "field",
        record,
        model: model(),
        fieldName,
        value: record[fieldName],
        metadata: fieldsMetadata()?.[fieldName],
      });
    };

  return (
    <RecordContextMenuContext.Provider value={{ open, tableHandler }}>
      {props.children}
      <ContextMenu
        visible={menu() !== null}
        position={menu()?.position ?? { x: 0, y: 0 }}
        items={menu() ? recordMenuItems(menu()!.target) : []}
        onClose={() => setMenu(null)}
      />
    </RecordContextMenuContext.Provider>
  );
};

export const useRecordContextMenu = (): RecordContextMenuApi => {
  const api = useContext(RecordContextMenuContext);
  if (!api) throw new Error("useRecordContextMenu must be used inside RecordContextMenuProvider");
  return api;
};
