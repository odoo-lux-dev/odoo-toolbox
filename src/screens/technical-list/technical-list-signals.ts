import { createSignal } from "solid-js";

export const [searchTermSignal, setSearchTermSignal] = createSignal("");
export const [showOnlyRequiredSignal, setShowOnlyRequiredSignal] = createSignal(false);
export const [showOnlyReadonlySignal, setShowOnlyReadonlySignal] = createSignal(false);
export const [showOnlyFieldsSignal, setShowOnlyFieldsSignal] = createSignal(false);
export const [showOnlyButtonsSignal, setShowOnlyButtonsSignal] = createSignal(false);
export const [expandedSectionsSignal, setExpandedSectionsSignal] = createSignal<Set<string>>(
  new Set(),
);

export const setSearchTerm = (term: string) => {
  setSearchTermSignal(term);
};

export const setShowOnlyRequired = (show: boolean) => {
  setShowOnlyRequiredSignal(show);
};

export const setShowOnlyReadonly = (show: boolean) => {
  setShowOnlyReadonlySignal(show);
};

export const setShowOnlyFields = (show: boolean) => {
  setShowOnlyFieldsSignal(show);
};

export const setShowOnlyButtons = (show: boolean) => {
  setShowOnlyButtonsSignal(show);
};

export const toggleSectionExpanded = (sectionId: string) => {
  const current = new Set(expandedSectionsSignal());
  if (current.has(sectionId)) {
    current.delete(sectionId);
  } else {
    current.add(sectionId);
  }
  setExpandedSectionsSignal(current);
};

export const setSectionExpanded = (sectionId: string, expanded: boolean) => {
  const current = new Set(expandedSectionsSignal());
  if (expanded) {
    current.add(sectionId);
  } else {
    current.delete(sectionId);
  }
  setExpandedSectionsSignal(current);
};

export const clearTechnicalFilters = () => {
  setSearchTermSignal("");
  setShowOnlyRequiredSignal(false);
  setShowOnlyReadonlySignal(false);
  setShowOnlyFieldsSignal(false);
  setShowOnlyButtonsSignal(false);
};

export const useTechnicalListFilters = () => ({
  searchTerm: searchTermSignal,
  showOnlyRequired: showOnlyRequiredSignal,
  showOnlyReadonly: showOnlyReadonlySignal,
  showOnlyFields: showOnlyFieldsSignal,
  showOnlyButtons: showOnlyButtonsSignal,

  setSearchTerm,
  setShowOnlyRequired,
  setShowOnlyReadonly,
  setShowOnlyFields,
  setShowOnlyButtons,
});

export const useTechnicalListSections = () => ({
  expandedSections: expandedSectionsSignal,

  toggleSectionExpanded,
  setSectionExpanded,

  isSectionExpanded: (sectionId: string) => expandedSectionsSignal().has(sectionId),
});
