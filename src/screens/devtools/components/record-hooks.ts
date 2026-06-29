import { type Accessor, createEffect, createMemo, createSignal } from "solid-js";

import { extractIds, getRelatedModel } from "@/screens/devtools/components/field-rendering-helpers";
import { useContextMenu } from "@/screens/devtools/components/ui-hooks";
import {
  executeQuery,
  focusRecord,
  queryStore,
  resultStore,
  setRpcQuery,
} from "@/screens/devtools/devtools-signals";
import { t } from "@/services/i18n-service";
import { Logger } from "@/services/logger";
import { odooRpcService } from "@/services/odoo-rpc-service";
import { FieldMetadata } from "@/types";

/**
 * Custom hook to centralize record actions (open, focus)
 */
export const useRecordActions = () => {
  /**
   * Opens a single record in Odoo
   * @param record - The record to open
   * @param model - The model (optional, will use parentModel or rpcQuery().model)
   * @param event - The event for stopPropagation
   * @param asPopup - Open in popup or main tab
   */
  const openRecord = async (
    record: Record<string, unknown>,
    model: string | undefined,
    event: Event,
    asPopup = false,
  ) => {
    event.stopPropagation();

    const recordId = record.id as number;
    const modelToUse = model || queryStore.model;

    if (!recordId || !modelToUse) {
      Logger.warn("Cannot open record: missing ID or model", {
        recordId,
        model,
        queryModel: queryStore.model,
      });
      return;
    }

    try {
      await odooRpcService.openView({
        model: modelToUse,
        recordIds: recordId,
        asPopup,
      });
    } catch (error) {
      Logger.error("Failed to open record:", error);
    }
  };

  /**
   * Focus on a single record
   * @param record - The record to focus on
   * @param model - The model (optional, will use parentModel or rpcQuery().model)
   * @param event - The event for stopPropagation
   */
  const focusOnRecord = async (
    record: Record<string, unknown>,
    model: string | undefined,
    event: Event,
  ) => {
    event.stopPropagation();

    const recordId = record.id as number;
    const modelToUse = model || queryStore.model;

    if (!recordId || !modelToUse) {
      Logger.warn("Cannot focus record: missing ID or model", {
        recordId,
        model,
        queryModel: queryStore.model,
      });
      return;
    }

    try {
      await focusRecord(modelToUse, recordId);
    } catch (error) {
      Logger.error("Failed to focus record:", error);
    }
  };

  /**
   * Opens multiple records in Odoo (for relational fields)
   * @param ids - The IDs of records to open
   * @param model - The model of the records
   * @param event - The event for stopPropagation
   * @param asPopup - Open in popup or main tab
   */
  const openRecords = async (ids: number[], model: string, event: Event, asPopup = false) => {
    event.stopPropagation();

    if (!model || ids.length === 0) {
      Logger.warn("Cannot open records: missing model or IDs", {
        model,
        ids,
      });
      return;
    }

    try {
      await odooRpcService.openView({
        model,
        recordIds: ids,
        asPopup,
      });
    } catch (error) {
      Logger.error("Failed to open records:", error);
    }
  };

  /**
   * Focus on multiple records (for relational fields)
   * @param ids - The IDs of records to focus on
   * @param model - The model of the records
   * @param event - The event for stopPropagation
   */
  const focusOnRecords = async (ids: number[], model: string, event: Event) => {
    event.stopPropagation();

    if (ids.length === 0 || !model) {
      Logger.warn("Cannot focus records: no IDs or model", {
        ids,
        model,
      });
      return;
    }

    try {
      await focusRecord(model, ids);
    } catch (error) {
      Logger.error("Failed to focus records:", error);
    }
  };

  return {
    openRecord,
    focusOnRecord,
    openRecords,
    focusOnRecords,
  };
};

interface ContextMenuState {
  visible: boolean;
  position: { x: number; y: number };
  record?: Record<string, unknown>;
  fieldName?: string;
  fieldValue?: unknown;
  fieldMetadata?: FieldMetadata;
  parentModel?: string;
}

export const useRecordContextMenu = () => {
  const [contextMenu, setContextMenu] = createSignal<ContextMenuState>({
    visible: false,
    position: { x: 0, y: 0 },
  });

  const { copyToClipboardWithFallback, extractRelationIds } = useContextMenu();

  const handleRecordContextMenu = (
    event: MouseEvent,
    record: Record<string, unknown>,
    parentModel?: string,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setContextMenu({
      visible: true,
      position: { x: event.clientX, y: event.clientY },
      record,
      parentModel,
    });
  };

  const handleFieldContextMenu = (
    event: MouseEvent,
    record: Record<string, unknown>,
    fieldName: string,
    fieldValue: unknown,
    fieldMetadata?: FieldMetadata,
    parentModel?: string,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setContextMenu({
      visible: true,
      position: { x: event.clientX, y: event.clientY },
      record,
      fieldName,
      fieldValue,
      fieldMetadata,
      parentModel,
    });
  };

  const closeContextMenu = () => {
    setContextMenu({ visible: false, position: { x: 0, y: 0 } });
  };

  const getContextMenuItems = () => {
    const items = [];
    const menu = contextMenu();

    if (menu.fieldName && menu.fieldValue !== undefined) {
      const fieldName = menu.fieldName;
      const fieldValue = menu.fieldValue;
      const fieldMetadata = menu.fieldMetadata;

      items.push({
        label: t("devtools.context_menu.field_title", [fieldName]),
        action: () => {
          /*no action*/
        },
        separator: true,
        isTitle: true,
      });

      items.push({
        label: t("devtools.context_menu.copy_field_name"),
        action: () => copyToClipboardWithFallback(fieldName),
      });

      items.push({
        label: t("devtools.context_menu.copy_field_value"),
        action: () => {
          const valueStr =
            typeof fieldValue === "object" ? JSON.stringify(fieldValue) : String(fieldValue);
          copyToClipboardWithFallback(valueStr);
        },
      });

      if (fieldMetadata?.relation) {
        const relationIds = extractRelationIds(fieldValue);
        if (relationIds.length > 0) {
          const modelName = getRelatedModel(fieldMetadata);
          const ids = extractIds(fieldValue);

          items.push({
            label: t("devtools.context_menu.copy_relation_ids", [relationIds.length]),
            action: () => copyToClipboardWithFallback(relationIds.join(", ")),
            separator: !(modelName && ids.length >= 1),
          });

          if (modelName && ids.length >= 1) {
            items.push({
              label:
                ids.length > 1
                  ? t("devtools.context_menu.copy_records_json")
                  : t("devtools.context_menu.copy_record_json"),
              action: async () => {
                const result = await odooRpcService.read(modelName, ids);
                copyToClipboardWithFallback(JSON.stringify(result, null, 2));
              },
              separator: true,
            });
          }

          if (modelName && ids.length > 0) {
            items.push({
              label: t("devtools.context_menu.focus_record"),
              action: async () => {
                try {
                  await focusRecord(modelName, ids);
                } catch (error) {
                  Logger.error("Failed to focus on relational record:", error);
                }
              },
            });

            items.push({
              label: t("devtools.context_menu.open_in_odoo"),
              action: async () => {
                try {
                  if (fieldMetadata.type === "many2one" && ids.length === 1) {
                    await odooRpcService.openView({
                      model: modelName,
                      recordIds: ids[0],
                      asPopup: false,
                    });
                  } else {
                    await odooRpcService.openView({
                      model: modelName,
                      recordIds: ids,
                      asPopup: false,
                    });
                  }
                } catch (error) {
                  Logger.error("Failed to open relational field:", error);
                }
              },
            });

            items.push({
              label: t("devtools.context_menu.open_in_odoo_popup"),
              action: async () => {
                try {
                  if (fieldMetadata.type === "many2one" && ids.length === 1) {
                    await odooRpcService.openView({
                      model: modelName,
                      recordIds: ids[0],
                      asPopup: true,
                    });
                  } else {
                    await odooRpcService.openView({
                      model: modelName,
                      recordIds: ids,
                      asPopup: true,
                    });
                  }
                } catch (error) {
                  Logger.error("Failed to open relational field in popup:", error);
                }
              },
            });
          }
        }
      }
    } else if (menu.record) {
      const record = menu.record;
      const recordId = record.id;

      const namePart = record.display_name || record.name;
      const idPart = recordId ? String(recordId) : t("common.unknown");
      const recordLabel = namePart ? `${namePart} - #${idPart}` : idPart;

      items.push({
        label: t("devtools.context_menu.record_title", [recordLabel]),
        action: () => {
          /* no action */
        },
        separator: true,
        isTitle: true,
      });

      if (recordId) {
        items.push({
          label: t("devtools.context_menu.copy_record_id"),
          action: () => copyToClipboardWithFallback(String(recordId)),
        });
      }

      items.push({
        label: t("devtools.context_menu.copy_record_json"),
        action: () => copyToClipboardWithFallback(JSON.stringify(record, null, 2)),
        separator: Boolean(recordId),
      });

      if (recordId) {
        const modelToUse = menu.parentModel || queryStore.model;

        if (modelToUse) {
          items.push({
            label: t("devtools.context_menu.open_in_odoo"),
            action: async () => {
              try {
                await odooRpcService.openView({
                  model: modelToUse,
                  recordIds: recordId as number,
                  asPopup: false,
                });
              } catch (error) {
                Logger.error("Failed to open record:", error);
              }
            },
          });

          items.push({
            label: t("devtools.context_menu.open_in_odoo_popup"),
            action: async () => {
              try {
                await odooRpcService.openView({
                  model: modelToUse,
                  recordIds: recordId as number,
                  asPopup: true,
                });
              } catch (error) {
                Logger.error("Failed to open record in popup:", error);
              }
            },
          });
        }
      }
    }

    return items;
  };

  return {
    contextMenu,
    handleRecordContextMenu,
    handleFieldContextMenu,
    closeContextMenu,
    getContextMenuItems,
  };
};

interface UseTableContextMenuOptions {
  data: Accessor<Record<string, unknown>[] | null>;
  fieldsMetadata: Accessor<Record<string, FieldMetadata> | null | undefined>;
  model: Accessor<string | undefined>;
  handleFieldContextMenu: (
    event: MouseEvent,
    record: Record<string, unknown>,
    fieldName: string,
    fieldValue: unknown,
    fieldMetadata?: FieldMetadata,
    parentModel?: string,
  ) => void;
}

export const useTableContextMenu = (options: UseTableContextMenuOptions) => {
  const handleTableContextMenu = (e: Event) => {
    const target = e.target as HTMLElement;
    const cell = target.closest("[data-field][data-row-index]") as HTMLElement;
    if (!cell) return;

    e.preventDefault();
    e.stopPropagation();

    const rowIndex = Number(cell.dataset.rowIndex || "0");
    const fieldName = cell.dataset.field || "";

    const data = options.data();
    if (data && data[rowIndex]) {
      const record = data[rowIndex];
      const fieldsMetadata = options.fieldsMetadata();
      const fieldMeta = fieldsMetadata?.[fieldName];

      options.handleFieldContextMenu(
        e as MouseEvent,
        record,
        fieldName,
        record[fieldName],
        fieldMeta,
        options.model(),
      );
    }
  };

  return { handleTableContextMenu };
};

export const useQueryIds = () => {
  createEffect(() => {
    const ids = queryStore.ids;
    const data = resultStore.data;
    if (ids.trim() && data) {
      const autoSyncIds = data.map((record) => record.id).join(", ");
      if (ids !== autoSyncIds) {
        if (queryStore.offset > 0) {
          setRpcQuery({ offset: 0 });
        }
      }
    }
  });

  createEffect(() => {
    const data = resultStore.data;
    if (data && data.length > 0 && !queryStore.ids.trim()) {
      const idsString = data.map((record) => record.id).join(", ");
      setRpcQuery({ ids: idsString });
    }
  });

  const clearIds = () => {
    setRpcQuery({ ids: "" });
  };

  return {
    queryIds: () => queryStore.ids,
    clearIds,
  };
};

export const usePagination = () => {
  const effectiveLimit = createMemo(() => resultStore.lastQuery?.limit || queryStore.limit);
  const effectiveOffset = createMemo(() => resultStore.lastQuery?.offset || queryStore.offset);

  const currentPage = createMemo(() => Math.floor(effectiveOffset() / effectiveLimit()) + 1);
  const totalPages = createMemo(() => {
    const total = resultStore.totalCount;
    return total ? Math.ceil(total / effectiveLimit()) : 1;
  });
  const startRecord = createMemo(() => effectiveOffset() + 1);
  const endRecord = createMemo(() =>
    Math.min(effectiveOffset() + (resultStore.data?.length || 0), resultStore.totalCount || 0),
  );

  const goToPage = async (page: number) => {
    const newOffset = (page - 1) * queryStore.limit;
    setRpcQuery({ ids: "" });
    await executeQuery(false, { offset: newOffset });
  };

  const goToPreviousPage = () => {
    if (currentPage() > 1) {
      goToPage(currentPage() - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage() < totalPages()) {
      goToPage(currentPage() + 1);
    }
  };

  return {
    totalCount: () => resultStore.totalCount,
    data: () => resultStore.data,
    currentPage,
    totalPages,
    startRecord,
    endRecord,
    goToPage,
    goToPreviousPage,
    goToNextPage,
  };
};
