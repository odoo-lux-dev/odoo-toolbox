interface FieldFiltersProps {
    searchTerm: string;
    onSearchChange: (term: string) => void;
    showOnlyRequired: boolean;
    onRequiredChange: (show: boolean) => void;
    showOnlyReadonly: boolean;
    onReadonlyChange: (show: boolean) => void;
    showOnlyFields: boolean;
    onFieldsChange: (show: boolean) => void;
    showOnlyButtons: boolean;
    onButtonsChange: (show: boolean) => void;
}

export const FieldFilters = ({
    searchTerm,
    onSearchChange,
    showOnlyRequired,
    onRequiredChange,
    showOnlyReadonly,
    onReadonlyChange,
    showOnlyFields,
    onFieldsChange,
    showOnlyButtons,
    onButtonsChange,
}: FieldFiltersProps) => (
    <div className="x-odoo-technical-list-info-filters">
        <div className="x-odoo-technical-list-info-search">
            <input
                type="text"
                placeholder="Search fields and buttons..."
                value={searchTerm}
                onInput={(e) =>
                    onSearchChange((e.target as HTMLInputElement).value)
                }
                className="x-odoo-technical-list-info-search-input"
            />
            <i className="fa fa-search" />
        </div>
        <div className="x-odoo-technical-list-info-search-filters-list">
            <div>
                <label className="x-odoo-technical-list-info-checkbox">
                    <input
                        type="checkbox"
                        checked={showOnlyRequired}
                        onInput={(e) =>
                            onRequiredChange(
                                (e.target as HTMLInputElement).checked,
                            )
                        }
                    />
                    <span>Required only</span>
                </label>
                <label className="x-odoo-technical-list-info-checkbox">
                    <input
                        type="checkbox"
                        checked={showOnlyReadonly}
                        onInput={(e) =>
                            onReadonlyChange(
                                (e.target as HTMLInputElement).checked,
                            )
                        }
                    />
                    <span>Readonly only</span>
                </label>
            </div>
            <div>
                <label className="x-odoo-technical-list-info-checkbox">
                    <input
                        type="checkbox"
                        checked={showOnlyFields}
                        onInput={(e) =>
                            onFieldsChange(
                                (e.target as HTMLInputElement).checked,
                            )
                        }
                    />
                    <span>Fields only</span>
                </label>
                <label className="x-odoo-technical-list-info-checkbox">
                    <input
                        type="checkbox"
                        checked={showOnlyButtons}
                        onInput={(e) =>
                            onButtonsChange(
                                (e.target as HTMLInputElement).checked,
                            )
                        }
                    />
                    <span>Buttons only</span>
                </label>
            </div>
        </div>
    </div>
);
