import { FieldItem } from "@/components/technical-list/field-item";
import { useTechnicalSidebar } from "@/components/technical-list/hooks/use-technical-sidebar";
import { EmptyState } from "@/components/technical-list/states";

export const SelectedFieldContent = () => {
    const { selectedFieldInfo, highlightField, clearFieldHighlight } =
        useTechnicalSidebar();

    if (!selectedFieldInfo) {
        return (
            <EmptyState
                icon="fa-mouse-pointer"
                message="Click on a field in the page to see its details"
            />
        );
    }

    return (
        <div className="x-odoo-technical-list-info-selected-field">
            <div className="x-odoo-technical-list-info-selected-field-header">
                <i className="fa fa-crosshairs" />
                <span>Selected Field</span>
            </div>
            <FieldItem
                field={selectedFieldInfo}
                onHighlight={highlightField}
                onClearHighlight={clearFieldHighlight}
            />
        </div>
    );
};
