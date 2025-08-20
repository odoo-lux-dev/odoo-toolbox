import { useComputed, useSignal } from "@preact/signals"
import { useEffect } from "preact/hooks"
import { QuickDomain } from "@/types"
import { validateDomain } from "@/utils/query-validation"

interface QuickDomainFormModalProps {
    domain: QuickDomain | null
    onSave: (data: { name: string; domain: string }) => void
    onCancel: () => void
    isOpen: boolean
}

export const QuickDomainFormModal = ({
    domain,
    onSave,
    onCancel,
    isOpen,
}: QuickDomainFormModalProps) => {
    const name = useSignal(domain?.name || "")
    const domainValue = useSignal(domain?.domain || "")
    const validation = useComputed(() => validateDomain(domainValue.value))

    const isValid = useComputed(() => validation.value.isValid)
    const canSave = useComputed(
        () => name.value.trim() && domainValue.value.trim() && isValid.value
    )

    useEffect(() => {
        if (isOpen) {
            name.value = domain?.name || ""
            domainValue.value = domain?.domain || ""
        }
    }, [domain, isOpen])

    const handleSubmit = (e: Event) => {
        e.preventDefault()
        if (canSave.value) {
            onSave({
                name: name.value.trim(),
                domain: domainValue.value.trim(),
            })
        }
    }

    const handleOverlayClick = (e: Event) => {
        if (e.target === e.currentTarget) {
            onCancel()
        }
    }

    if (!isOpen) return null

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal-content">
                <form className="quick-domain-form" onSubmit={handleSubmit}>
                    <h4>{domain ? "Edit Domain" : "Add New Domain"}</h4>

                    <div className="form-group">
                        <label>Name:</label>
                        <input
                            type="text"
                            value={name.value}
                            onInput={(e) =>
                            (name.value = (
                                e.target as HTMLInputElement
                            ).value)
                            }
                            placeholder="e.g., Active Records"
                            className="form-input"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Domain:</label>
                        <textarea
                            value={domainValue.value}
                            onInput={(e) =>
                            (domainValue.value = (
                                e.target as HTMLTextAreaElement
                            ).value)
                            }
                            placeholder='e.g., [["active", "=", true]]'
                            className={`form-input ${!isValid.value && domainValue.value ? "error" : ""}`}
                            rows={3}
                            required
                        />
                        {!isValid.value && domainValue.value && (
                            <div className="domain-error">
                                {validation.value.error}
                            </div>
                        )}
                    </div>

                    <div className="form-actions">
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={!canSave.value}
                        >
                            {domain ? "Update" : "Add"} Domain
                        </button>
                        <button
                            type="button"
                            className="btn btn-secondary-outline"
                            onClick={onCancel}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
