import { useState } from "preact/hooks";
import {
    extractIds,
    getRelatedModel,
} from "@/components/devtools/field-rendering/field-utils";
import { focusRecord } from "@/contexts/devtools-signals";
import { useRpcQuery } from "@/contexts/devtools-signals-hook";
import { Logger } from "@/services/logger";
import { odooRpcService } from "@/services/odoo-rpc-service";
import { FieldMetadata } from "@/types";
import { useContextMenu } from "./use-context-menu";

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
    const [contextMenu, setContextMenu] = useState<ContextMenuState>({
        visible: false,
        position: { x: 0, y: 0 },
    });
    const { query: rpcQuery } = useRpcQuery();

    const { copyToClipboardWithFallback, extractRelationIds } =
        useContextMenu();

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

        if (contextMenu.fieldName && contextMenu.fieldValue !== undefined) {
            const fieldName = contextMenu.fieldName;
            const fieldValue = contextMenu.fieldValue;
            const fieldMetadata = contextMenu.fieldMetadata;

            items.push({
                label: `Field: ${fieldName}`,
                action: () => {
                    /*no action*/
                },
                separator: true,
                isTitle: true,
            });

            items.push({
                label: "Copy field name",
                action: () => copyToClipboardWithFallback(fieldName),
            });

            items.push({
                label: "Copy field value",
                action: () => {
                    const valueStr =
                        typeof fieldValue === "object"
                            ? JSON.stringify(fieldValue)
                            : String(fieldValue);
                    copyToClipboardWithFallback(valueStr);
                },
            });

            if (fieldMetadata?.relation) {
                const relationIds = extractRelationIds(fieldValue);
                if (relationIds.length > 0) {
                    const modelName = getRelatedModel(fieldMetadata);
                    const ids = extractIds(fieldValue);

                    items.push({
                        label: `Copy relation IDs (${relationIds.length})`,
                        action: () =>
                            copyToClipboardWithFallback(relationIds.join(", ")),
                        separator: !(modelName && ids.length >= 1),
                    });

                    if (modelName && ids.length >= 1) {
                        items.push({
                            label: `Copy record${ids.length > 1 ? "s" : ""} (JSON)`,
                            action: async () => {
                                const result = await odooRpcService.read(
                                    modelName,
                                    ids,
                                );
                                copyToClipboardWithFallback(
                                    JSON.stringify(result, null, 2),
                                );
                            },
                            separator: true,
                        });
                    }

                    if (modelName && ids.length > 0) {
                        items.push({
                            label: "Focus on record",
                            action: async () => {
                                try {
                                    await focusRecord(modelName, ids);
                                } catch (error) {
                                    Logger.error(
                                        "Failed to focus on relational record:",
                                        error,
                                    );
                                }
                            },
                        });

                        items.push({
                            label: "Open in Odoo",
                            action: async () => {
                                try {
                                    if (
                                        fieldMetadata.type === "many2one" &&
                                        ids.length === 1
                                    ) {
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
                                    Logger.error(
                                        "Failed to open relational field:",
                                        error,
                                    );
                                }
                            },
                        });

                        items.push({
                            label: "Open in Odoo popup",
                            action: async () => {
                                try {
                                    if (
                                        fieldMetadata.type === "many2one" &&
                                        ids.length === 1
                                    ) {
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
                                    Logger.error(
                                        "Failed to open relational field in popup:",
                                        error,
                                    );
                                }
                            },
                        });
                    }
                }
            }
        } else if (contextMenu.record) {
            const record = contextMenu.record;
            const recordId = record.id;

            items.push({
                label: `Record: ${record.display_name || record.name ? `${record.display_name || record.name} - #` : ""}${recordId || "Unknown"}`,
                action: () => {
                    /* no action */
                },
                separator: true,
                isTitle: true,
            });

            if (recordId) {
                items.push({
                    label: "Copy record ID",
                    action: () => copyToClipboardWithFallback(String(recordId)),
                });
            }

            items.push({
                label: "Copy record (JSON)",
                action: () =>
                    copyToClipboardWithFallback(
                        JSON.stringify(record, null, 2),
                    ),
                separator: Boolean(recordId),
            });

            if (recordId) {
                const modelToUse = contextMenu.parentModel || rpcQuery.model;

                if (modelToUse) {
                    items.push({
                        label: "Open in Odoo",
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
                        label: "Open in Odoo popup",
                        action: async () => {
                            try {
                                await odooRpcService.openView({
                                    model: modelToUse,
                                    recordIds: recordId as number,
                                    asPopup: true,
                                });
                            } catch (error) {
                                Logger.error(
                                    "Failed to open record in popup:",
                                    error,
                                );
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
