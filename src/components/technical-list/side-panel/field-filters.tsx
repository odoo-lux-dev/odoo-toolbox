interface FieldFiltersProps {
  searchTerm: string
  onSearchChange: (term: string) => void
  showOnlyRequired: boolean
  onRequiredChange: (show: boolean) => void
  showOnlyReadonly: boolean
  onReadonlyChange: (show: boolean) => void
}

export const FieldFilters = ({
  searchTerm,
  onSearchChange,
  showOnlyRequired,
  onRequiredChange,
  showOnlyReadonly,
  onReadonlyChange,
}: FieldFiltersProps) => (
  <div className="x-odoo-technical-list-info-filters">
    <div className="x-odoo-technical-list-info-search">
      <input
        type="text"
        placeholder="Search fields..."
        value={searchTerm}
        onInput={(e) => onSearchChange((e.target as HTMLInputElement).value)}
        className="x-odoo-technical-list-info-search-input"
      />
      <i className="fa fa-search" />
    </div>
    <label className="x-odoo-technical-list-info-checkbox">
      <input
        type="checkbox"
        checked={showOnlyRequired}
        onChange={(e) =>
          onRequiredChange((e.target as HTMLInputElement).checked)
        }
      />
      <span>Required only</span>
    </label>
    <label className="x-odoo-technical-list-info-checkbox">
      <input
        type="checkbox"
        checked={showOnlyReadonly}
        onChange={(e) =>
          onReadonlyChange((e.target as HTMLInputElement).checked)
        }
      />
      <span>Readonly only</span>
    </label>
  </div>
)
