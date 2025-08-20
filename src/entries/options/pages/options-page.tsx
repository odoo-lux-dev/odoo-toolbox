import { ExtensionOptions } from "../options"

export const OptionsPage = () => {
    return (
        <div className="x-odoo-options-page">
            <div>
                <h2 className="x-odoo-options-page-option-title">Odoo</h2>
                <div className="x-odoo-options-page-options-container">
                    {ExtensionOptions.filter(
                        (option) => option.category === "Odoo"
                    ).map((option) => (
                        <option.component key={option.component.name} />
                    ))}
                </div>
            </div>
            <div>
                <h2 className="x-odoo-options-page-option-title">Odoo.SH</h2>
                <div className="x-odoo-options-page-options-container">
                    {ExtensionOptions.filter(
                        (option) => option.category === "Odoo.SH"
                    ).map((option) => (
                        <option.component key={option.component.name} />
                    ))}
                </div>
            </div>
        </div>
    )
}
