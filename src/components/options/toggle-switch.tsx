interface ToggleSwitchProps {
    isChecked: boolean
    onInput: (checked: boolean) => Promise<void> | void
    labelOn?: string
    labelOff?: string
    disabled?: boolean
    className?: string
}

export const ToggleSwitch = ({
    isChecked,
    onInput,
    labelOn = "ON",
    labelOff = "OFF",
    disabled = false,
    className = "default-switch",
}: ToggleSwitchProps) => {
    const handleChange = async (e: Event) => {
        const target = e.target as HTMLInputElement
        const newChecked = target.checked
        await onInput(newChecked)
    }

    return (
        <label className={`switch ${className}`}>
            <input
                type="checkbox"
                checked={isChecked}
                onInput={handleChange}
                disabled={disabled}
            />
            <span className="slider round"></span>
            <span className="x-odoo-options-page-label-on">{labelOn}</span>
            <span className="x-odoo-options-page-label-off">{labelOff}</span>
        </label>
    )
}
