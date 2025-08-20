import "@/components/devtools/selects/field-select.styles.scss"
import { useComputed, useSignal } from "@preact/signals"
import { fieldsMetadataSignal, setRpcQuery } from "@/contexts/devtools-signals"
import { useRpcQuery, useRpcResult } from "@/contexts/devtools-signals-hook"
import { useDropdownNavigation } from "@/hooks/use-dropdown-navigation"
import { FieldMetadata } from "@/types"

interface FieldSelectProps {
    placeholder?: string
}

export const FieldSelect = ({
    placeholder = "Select fields...",
}: FieldSelectProps) => {
    const { query: rpcQuery } = useRpcQuery()
    const { result: rpcResult } = useRpcResult()
    const { model, selectedFields: values, fieldsMetadata } = rpcQuery
    const disabled = !model

    const onChange = (fields: string[]) => {
        setRpcQuery({ selectedFields: fields })
    }

    const inputValue = useSignal("")
    const isOpen = useSignal(false)

    const filteredFields = useComputed(() => {
        const currentFieldsMetadata = fieldsMetadataSignal.value
        if (!model || !currentFieldsMetadata) return []

        const fieldEntries = Object.entries(currentFieldsMetadata).map(
            ([name, info]) => ({
                name,
                info,
            })
        )

        if (inputValue.value.length === 0) {
            return fieldEntries
        } else {
            return fieldEntries.filter(
                (field) =>
                    field.name
                        .toLowerCase()
                        .includes(inputValue.value.toLowerCase()) ||
                    field.info.string
                        .toLowerCase()
                        .includes(inputValue.value.toLowerCase())
            )
        }
    })

    const visibleFields = useComputed(() => filteredFields.value.slice(0, 100))

    const { focusedIndex, resetFocus, handleKeyDown } = useDropdownNavigation({
        items: visibleFields.value,
        isOpen: isOpen.value,
        onSelect: (field: { name: string; info: FieldMetadata }) =>
            handleFieldToggle(field.name),
        onClose: () => {
            isOpen.value = false
            inputValue.value = ""
        },
        cyclicNavigation: true,
        acceptTab: false,
        triggerKey: undefined,
        containerSelector: ".select-dropdown",
        itemSelector: ".select-option",
    })

    const handleInputChange = (e: Event) => {
        const target = e.target as HTMLInputElement
        inputValue.value = target.value
        resetFocus()
        isOpen.value = true
    }

    const handleFieldToggle = (fieldName: string) => {
        const newValues = values.includes(fieldName)
            ? values.filter((f) => f !== fieldName)
            : [...values, fieldName]
        onChange(newValues)

        inputValue.value = ""
        isOpen.value = false
        resetFocus()
    }

    const handleInputFocus = () => {
        resetFocus()
        isOpen.value = true
    }

    const handleInputBlur = () => {
        setTimeout(() => {
            isOpen.value = false
            inputValue.value = ""
            resetFocus()
        }, 150)
    }

    const handleRemoveField = (fieldName: string) => {
        const newValues = values.filter((f) => f !== fieldName)
        onChange(newValues)
    }

    return (
        <div className="select-container">
            {values.length > 0 ? (
                <div className="selected-fields">
                    {values.map((fieldName) => (
                        <div key={fieldName} className="selected-field">
                            <span className="field-name">{fieldName}</span>
                            <button
                                type="button"
                                className="remove-field"
                                onClick={() => handleRemoveField(fieldName)}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            ) : null}

            <input
                type="text"
                value={inputValue.value}
                onInput={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder={placeholder}
                className="form-input"
                disabled={disabled || !model || rpcResult.loading}
            />
            {!fieldsMetadata && model && (
                <div className="loading-spinner">Loading...</div>
            )}

            {isOpen.value &&
                filteredFields.value.length > 0 &&
                !disabled &&
                model && (
                    <div className="select-dropdown">
                        {visibleFields.value.map((field, index) => (
                            <div
                                key={field.name}
                                className={`select-option ${values.includes(field.name) ? "selected" : ""} ${index === focusedIndex ? "focused" : ""}`}
                                onClick={() => handleFieldToggle(field.name)}
                            >
                                <div className="select-technical-name">
                                    {field.name}
                                </div>
                                <div className="select-display-name">
                                    {field.info.string}
                                </div>
                                <div className="field-type">
                                    {field.info.type}
                                </div>
                                {values.includes(field.name) && (
                                    <div className="field-selected-indicator">
                                        ✓
                                    </div>
                                )}
                            </div>
                        ))}
                        {filteredFields.value.length > 100 && (
                            <div className="select-more">
                                Showing first 100 results. Refine your search
                                for more specific results.
                            </div>
                        )}
                    </div>
                )}
        </div>
    )
}
