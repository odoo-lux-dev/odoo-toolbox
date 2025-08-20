import {
    expandedSectionsSignal,
    searchTermSignal,
    setSearchTerm,
    setSectionExpanded,
    setShowOnlyReadonly,
    setShowOnlyRequired,
    showOnlyReadonlySignal,
    showOnlyRequiredSignal,
    toggleSectionExpanded,
} from "./technical-list-signals"

export const useTechnicalListFilters = () => ({
    searchTerm: searchTermSignal.value,
    showOnlyRequired: showOnlyRequiredSignal.value,
    showOnlyReadonly: showOnlyReadonlySignal.value,

    setSearchTerm,
    setShowOnlyRequired,
    setShowOnlyReadonly,
})

export const useTechnicalListSections = () => ({
    expandedSections: expandedSectionsSignal.value,

    toggleSectionExpanded,
    setSectionExpanded,

    isSectionExpanded: (sectionId: string) =>
        expandedSectionsSignal.value.has(sectionId),
})
