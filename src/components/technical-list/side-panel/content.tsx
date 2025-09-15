import { List, MousePointerClick } from "lucide-preact"
import { ButtonItem } from "@/components/technical-list/button-item"
import { DatabaseInfoComponent } from "@/components/technical-list/database-info"
import { FieldItem } from "@/components/technical-list/field-item"
import { useTechnicalSidebar } from "@/components/technical-list/hooks/use-technical-sidebar"
import { RecordInfo } from "@/components/technical-list/record-info"
import { EmptyState } from "@/components/technical-list/states"
import { WebsiteInfo } from "@/components/technical-list/website-info"
import { useTechnicalListFilters } from "@/contexts/technical-list-signals"
import { FieldFilters } from "./field-filters"

export const PanelContent = () => {
    const {
        viewInfo,
        highlightField,
        highlightButton,
        clearFieldHighlight,
        clearButtonHighlight,
        isWebsite,
        hasFields,
        hasButtons,
        dbInfo,
    } = useTechnicalSidebar()

    const {
        searchTerm,
        showOnlyRequired,
        showOnlyReadonly,
        showOnlyFields,
        showOnlyButtons,
        setSearchTerm,
        setShowOnlyRequired,
        setShowOnlyReadonly,
        setShowOnlyFields,
        setShowOnlyButtons,
    } = useTechnicalListFilters()

    if (!viewInfo) return null

    const filteredFields = viewInfo.technicalFields.filter((field) => {
        const matchesSearch =
            field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            field.label?.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesRequired = !showOnlyRequired || field.canBeRequired
        const matchesReadonly = !showOnlyReadonly || field.canBeReadonly
        const matchesType = !showOnlyButtons // Show fields when "buttons only" is not active
        return (
            matchesSearch && matchesRequired && matchesReadonly && matchesType
        )
    })

    const filteredButtons = viewInfo.technicalButtons.filter((button) => {
        const matchesSearch =
            button.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            button.label?.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesType = !showOnlyFields // Show buttons when "fields only" is not active
        return matchesSearch && matchesType
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

            {(hasFields || hasButtons) && (
                <FieldFilters
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    showOnlyRequired={showOnlyRequired}
                    onRequiredChange={setShowOnlyRequired}
                    showOnlyReadonly={showOnlyReadonly}
                    onReadonlyChange={setShowOnlyReadonly}
                    showOnlyFields={showOnlyFields}
                    onFieldsChange={setShowOnlyFields}
                    showOnlyButtons={showOnlyButtons}
                    onButtonsChange={setShowOnlyButtons}
                />
            )}

            {filteredFields.length > 0 && (
                <div className="x-odoo-technical-list-info-fields">
                    <div className="x-odoo-technical-list-info-section-title">
                        <List size={16} />
                        Fields ({filteredFields.length})
                    </div>
                    {filteredFields.map((field, index) => (
                        <FieldItem
                            key={`${field.name}-${index}`}
                            field={field}
                            onHighlight={highlightField}
                            onClearHighlight={clearFieldHighlight}
                        />
                    ))}
                </div>
            )}

            {filteredButtons.length > 0 && (
                <div className="x-odoo-technical-list-info-fields">
                    <div className="x-odoo-technical-list-info-section-title">
                        <MousePointerClick size={16} />
                        Buttons ({filteredButtons.length})
                    </div>
                    {filteredButtons.map((button, index) => (
                        <ButtonItem
                            key={`${button.name}-${index}`}
                            button={button}
                            onHighlight={highlightButton}
                            onClearHighlight={clearButtonHighlight}
                        />
                    ))}
                </div>
            )}

            {filteredFields.length === 0 && filteredButtons.length === 0 ? (
                hasFields || hasButtons ? (
                    <EmptyState
                        icon="fa-filter"
                        message="No elements match your filters"
                    />
                ) : !isWebsite ? (
                    <EmptyState
                        icon="fa-info-circle"
                        message="No technical fields or buttons found in this view"
                    />
                ) : null
            ) : null}
        </>
    )
}
