import { ButtonItem } from "@/components/technical-list/button-item";
import { useTechnicalSidebar } from "@/components/technical-list/hooks/use-technical-sidebar";
import { EmptyState } from "@/components/technical-list/states";

export const SelectedButtonContent = () => {
    const { selectedButtonInfo, highlightButton, clearButtonHighlight } =
        useTechnicalSidebar();

    if (!selectedButtonInfo) {
        return (
            <EmptyState
                icon="fa-mouse-pointer"
                message="Click on a button in the page to see its details"
            />
        );
    }

    return (
        <div className="x-odoo-technical-list-info-selected-field">
            <div className="x-odoo-technical-list-info-selected-field-header">
                <i className="fa fa-crosshairs" />
                <span>Selected Button</span>
            </div>
            <ButtonItem
                button={selectedButtonInfo}
                onHighlight={highlightButton}
                onClearHighlight={clearButtonHighlight}
            />
        </div>
    );
};
