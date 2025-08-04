import { useState } from "preact/hooks"
import { WebsiteInfo } from "@/components/technical-list/website-info"
import { EmptyState } from "@/components/technical-list/states"
import { FieldItem } from "@/components/technical-list/field-item"
import { RecordInfo } from "@/components/technical-list/record-info"
import { DatabaseInfoComponent } from "@/components/technical-list/database-info"
import { FieldFilters } from "./field-filters"
import { useTechnicalSidebarContext } from "@/contexts"

export const PanelContent = () => {
  const {
    viewInfo,
    highlightField,
    clearFieldHighlight,
    isWebsite,
    hasFields,
    dbInfo,
  } = useTechnicalSidebarContext()

  const [searchTerm, setSearchTerm] = useState("")
  const [showOnlyRequired, setShowOnlyRequired] = useState(false)
  const [showOnlyReadonly, setShowOnlyReadonly] = useState(false)

  if (!viewInfo) return null

  const filteredFields = viewInfo.technicalFields.filter((field) => {
    const matchesSearch =
      field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field.label?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRequired = !showOnlyRequired || field.canBeRequired
    const matchesReadonly = !showOnlyReadonly || field.canBeReadonly
    return matchesSearch && matchesRequired && matchesReadonly
  })

  return (
    <>
      {dbInfo && !isWebsite && <DatabaseInfoComponent dbInfo={dbInfo} />}

      {isWebsite && viewInfo.websiteInfo ? (
        <WebsiteInfo websiteInfo={viewInfo.websiteInfo} />
      ) : viewInfo.currentModel ? (
        <RecordInfo
          currentModel={viewInfo.currentModel}
          currentRecordId={viewInfo.currentRecordId}
          viewType={viewInfo.viewType}
        />
      ) : null}

      {hasFields && (
        <FieldFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          showOnlyRequired={showOnlyRequired}
          onRequiredChange={setShowOnlyRequired}
          showOnlyReadonly={showOnlyReadonly}
          onReadonlyChange={setShowOnlyReadonly}
        />
      )}

      {filteredFields.length > 0 ? (
        <div className="x-odoo-technical-list-info-fields">
          {filteredFields.map((field, index) => (
            <FieldItem
              key={`${field.name}-${index}`}
              field={field}
              onHighlight={highlightField}
              onClearHighlight={clearFieldHighlight}
            />
          ))}
        </div>
      ) : hasFields ? (
        <EmptyState icon="fa-filter" message="No fields match your filters" />
      ) : !isWebsite ? (
        <EmptyState
          icon="fa-info-circle"
          message="No technical fields found in this view"
        />
      ) : null}
    </>
  )
}
