import { WebsiteInfo } from "@/components/technical-list/website-info"
import { RecordInfo } from "@/components/technical-list/record-info"
import { DatabaseInfoComponent } from "@/components/technical-list/database-info"
import { FieldItem } from "@/components/technical-list/field-item"
import { useTechnicalSidebarContext } from "@/contexts"
import { EmptyState } from "@/components/technical-list/states"

export const SelectedFieldContent = () => {
  const {
    selectedFieldInfo,
    viewInfo,
    highlightField,
    clearFieldHighlight,
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

      {selectedFieldInfo ? (
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
      ) : (
        <EmptyState
          icon="fa-mouse-pointer"
          message="Click on a field in the page to see its details"
        />
      )}
    </>
  )
}
