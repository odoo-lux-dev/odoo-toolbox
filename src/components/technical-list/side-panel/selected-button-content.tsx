import { ButtonItem } from "@/components/technical-list/button-item"
import { DatabaseInfoComponent } from "@/components/technical-list/database-info"
import { RecordInfo } from "@/components/technical-list/record-info"
import { EmptyState } from "@/components/technical-list/states"
import { WebsiteInfo } from "@/components/technical-list/website-info"
import { useTechnicalSidebarContext } from "@/contexts/technical-sidebar-context"

export const SelectedButtonContent = () => {
    const {
        selectedButtonInfo,
        viewInfo,
        highlightButton,
        clearButtonHighlight,
        isWebsite,
        dbInfo,
    } = useTechnicalSidebarContext()

    return (
        <>
            {dbInfo ? <DatabaseInfoComponent dbInfo={dbInfo} /> : null}

            {isWebsite && viewInfo?.websiteInfo ? (
                <WebsiteInfo websiteInfo={viewInfo.websiteInfo} />
            ) : viewInfo?.currentModel ? (
                <RecordInfo
                    currentModel={viewInfo.currentModel}
                    currentRecordId={viewInfo.currentRecordId}
                    viewType={viewInfo.viewType}
                />
            ) : null}

            {selectedButtonInfo ? (
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
            ) : (
                <EmptyState
                    icon="fa-mouse-pointer"
                    message="Click on a button in the page to see its details"
                />
            )}
        </>
    )
}
