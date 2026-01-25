import { HugeiconsIcon } from "@hugeicons/react";
import {
    MouseLeftClick06Icon,
    FilterIcon,
    InformationCircleIcon,
    InputShortTextIcon,
} from "@hugeicons/core-free-icons";
import { ButtonItem } from "@/components/technical-list/button-item";
import { DatabaseInfoComponent } from "@/components/technical-list/database-info";
import { FieldItem } from "@/components/technical-list/field-item";
import { useTechnicalSidebar } from "@/components/technical-list/hooks/use-technical-sidebar";
import { RecordInfo } from "@/components/technical-list/record-info";
import { EmptyState } from "@/components/technical-list/states";
import { WebsiteInfo } from "@/components/technical-list/website-info";
import { useTechnicalListFilters } from "@/contexts/technical-list-signals";
import { FieldFilters } from "./field-filters";

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
    } = useTechnicalSidebar();

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
    } = useTechnicalListFilters();

    if (!viewInfo) return null;

    const filteredFields = viewInfo.technicalFields.filter((field) => {
        const matchesSearch =
            field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            field.label?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRequired = !showOnlyRequired || field.canBeRequired;
        const matchesReadonly = !showOnlyReadonly || field.canBeReadonly;
        const matchesType = !showOnlyButtons;
        return (
            matchesSearch && matchesRequired && matchesReadonly && matchesType
        );
    });

    const filteredButtons = viewInfo.technicalButtons.filter((button) => {
        const matchesSearch =
            button.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            button.label?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = !showOnlyFields;
        return matchesSearch && matchesType;
    });

    return (
        <>
            {dbInfo && !isWebsite ? (
                <DatabaseInfoComponent dbInfo={dbInfo} />
            ) : null}

            {isWebsite && viewInfo.websiteInfo ? (
                <WebsiteInfo websiteInfo={viewInfo.websiteInfo} />
            ) : viewInfo.currentModel ? (
                <RecordInfo />
            ) : null}

            {hasFields || hasButtons ? (
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
            ) : null}

            {filteredFields.length > 0 ? (
                <div className="space-y-3 px-6 py-4 border-solid border-b border-base-200">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-base-content/50">
                        <HugeiconsIcon
                            icon={InputShortTextIcon}
                            size={16}
                            color="currentColor"
                            strokeWidth={1.6}
                        />
                        Fields list ({filteredFields.length})
                    </div>
                    <div className="space-y-3">
                        {filteredFields.map((field, index) => (
                            <FieldItem
                                key={`${field.name}-${index}`}
                                field={field}
                                onHighlight={highlightField}
                                onClearHighlight={clearFieldHighlight}
                            />
                        ))}
                    </div>
                </div>
            ) : null}

            {filteredButtons.length > 0 ? (
                <div className="space-y-3 px-6 py-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-base-content/50">
                        <HugeiconsIcon
                            icon={MouseLeftClick06Icon}
                            size={16}
                            color="currentColor"
                            strokeWidth={1.6}
                        />
                        Buttons list ({filteredButtons.length})
                    </div>
                    <div className="space-y-3">
                        {filteredButtons.map((button, index) => (
                            <ButtonItem
                                key={`${button.name}-${index}`}
                                button={button}
                                onHighlight={highlightButton}
                                onClearHighlight={clearButtonHighlight}
                            />
                        ))}
                    </div>
                </div>
            ) : null}

            {filteredFields.length === 0 && filteredButtons.length === 0 ? (
                hasFields || hasButtons ? (
                    <div className="px-6 py-6">
                        <EmptyState
                            icon={
                                <HugeiconsIcon
                                    icon={FilterIcon}
                                    size={32}
                                    color="currentColor"
                                    strokeWidth={1.6}
                                />
                            }
                            message="No elements match your filters"
                        />
                    </div>
                ) : !isWebsite ? (
                    <div className="px-6 py-6">
                        <EmptyState
                            icon={
                                <HugeiconsIcon
                                    icon={InformationCircleIcon}
                                    size={32}
                                    color="currentColor"
                                    strokeWidth={1.6}
                                />
                            }
                            message="No technical fields or buttons found in this view"
                        />
                    </div>
                ) : null
            ) : null}
        </>
    );
};
