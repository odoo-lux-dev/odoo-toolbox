import {
    expandedSectionsSignal,
    searchTermSignal,
    setSearchTerm,
    setSectionExpanded,
    setShowOnlyButtons,
    setShowOnlyFields,
    setShowOnlyReadonly,
    setShowOnlyRequired,
    showOnlyButtonsSignal,
    showOnlyFieldsSignal,
    showOnlyReadonlySignal,
    showOnlyRequiredSignal,
    toggleSectionExpanded,
} from "./technical-list-signals"

export const useTechnicalListFilters = () => ({
    searchTerm: searchTermSignal.value,
    showOnlyRequired: showOnlyRequiredSignal.value,
    showOnlyReadonly: showOnlyReadonlySignal.value,
    showOnlyFields: showOnlyFieldsSignal.value,
    showOnlyButtons: showOnlyButtonsSignal.value,

    setSearchTerm,
    setShowOnlyRequired,
    setShowOnlyReadonly,
    setShowOnlyFields,
    setShowOnlyButtons,
})

export const useTechnicalListSections = () => ({
    expandedSections: expandedSectionsSignal.value,

    toggleSectionExpanded,
    setSectionExpanded,

    isSectionExpanded: (sectionId: string) =>
        expandedSectionsSignal.value.has(sectionId),
})
