import { useCallback } from "preact/hooks";
import { FieldMetadata } from "@/types";

interface UseTableContextMenuOptions {
    data: Record<string, unknown>[] | null;
    fieldsMetadata: Record<string, FieldMetadata> | null | undefined;
    model: string | undefined;
    handleFieldContextMenu: (
        event: MouseEvent,
        record: Record<string, unknown>,
        fieldName: string,
        fieldValue: unknown,
        fieldMetadata?: FieldMetadata,
        parentModel?: string,
    ) => void;
}

/**
 * Hook that creates a context menu handler for VirtualTable components.
 * Factorizes the common logic of resolving a cell's record and field metadata
 * from DOM data attributes, then delegating to handleFieldContextMenu.
 */
export const useTableContextMenu = ({
    data,
    fieldsMetadata,
    model,
    handleFieldContextMenu,
}: UseTableContextMenuOptions) => {
    const handleTableContextMenu = useCallback(
        (e: Event) => {
            const target = e.target as HTMLElement;
            const cell = target.closest(
                "[data-field][data-row-index]",
            ) as HTMLElement;
            if (!cell) return;

            e.preventDefault();
            e.stopPropagation();

            const rowIndex = Number(cell.dataset.rowIndex || "0");
            const fieldName = cell.dataset.field || "";

            if (data && data[rowIndex]) {
                const record = data[rowIndex];
                const fieldMeta = fieldsMetadata?.[fieldName];

                handleFieldContextMenu(
                    e as MouseEvent,
                    record,
                    fieldName,
                    record[fieldName],
                    fieldMeta,
                    model,
                );
            }
        },
        [data, fieldsMetadata, handleFieldContextMenu, model],
    );

    return { handleTableContextMenu };
};
