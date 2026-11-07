import type { ViewInfo } from "./types";

export type KindFilter = "all" | "fields" | "buttons";

export interface ElementFilters {
  searchTerm: string;
  onlyRequired: boolean;
  onlyReadonly: boolean;
  kind: KindFilter;
}

export const DEFAULT_FILTERS: ElementFilters = {
  searchTerm: "",
  onlyRequired: false,
  onlyReadonly: false,
  kind: "all",
};

export const filterElements = (
  info: Pick<ViewInfo, "technicalFields" | "technicalButtons"> | null,
  filters: ElementFilters,
) => {
  if (!info) return { fields: [], buttons: [] };
  const term = filters.searchTerm.toLowerCase();
  const matches = (item: { name: string; label: string }) =>
    item.name.toLowerCase().includes(term) || item.label.toLowerCase().includes(term);
  return {
    fields:
      filters.kind === "buttons"
        ? []
        : info.technicalFields.filter(
            (field) =>
              matches(field) &&
              (!filters.onlyRequired || field.canBeRequired) &&
              (!filters.onlyReadonly || field.canBeReadonly),
          ),
    // Buttons have no required/readonly attribute: they never match those filters.
    buttons:
      filters.kind === "fields" || filters.onlyRequired || filters.onlyReadonly
        ? []
        : info.technicalButtons.filter(matches),
  };
};
