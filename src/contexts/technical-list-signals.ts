import { signal } from "@preact/signals"

export const searchTermSignal = signal("")
export const showOnlyRequiredSignal = signal(false)
export const showOnlyReadonlySignal = signal(false)
export const expandedSectionsSignal = signal<Set<string>>(new Set())

export const setSearchTerm = (term: string) => {
    searchTermSignal.value = term
}

export const setShowOnlyRequired = (show: boolean) => {
    showOnlyRequiredSignal.value = show
}

export const setShowOnlyReadonly = (show: boolean) => {
    showOnlyReadonlySignal.value = show
}

export const toggleSectionExpanded = (sectionId: string) => {
    const current = new Set(expandedSectionsSignal.value)
    if (current.has(sectionId)) {
        current.delete(sectionId)
    } else {
        current.add(sectionId)
    }
    expandedSectionsSignal.value = current
}

export const setSectionExpanded = (sectionId: string, expanded: boolean) => {
    const current = new Set(expandedSectionsSignal.value)
    if (expanded) {
        current.add(sectionId)
    } else {
        current.delete(sectionId)
    }
    expandedSectionsSignal.value = current
}

export const clearTechnicalFilters = () => {
    searchTermSignal.value = ""
    showOnlyRequiredSignal.value = false
    showOnlyReadonlySignal.value = false
}
