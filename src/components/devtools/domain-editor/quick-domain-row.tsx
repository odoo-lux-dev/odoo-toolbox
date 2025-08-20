import { GripVertical } from "lucide-preact"
import { QuickDomain } from "@/types"

interface QuickDomainRowProps {
    domain: QuickDomain
    slotId: string
    itemId: string
    onDomainClick: (domain: string) => void
    onEdit: (domain: QuickDomain) => void
    onDelete: (domainId: string) => void
}

export const QuickDomainRow = ({
    domain,
    slotId,
    itemId,
    onDomainClick,
    onEdit,
    onDelete,
}: QuickDomainRowProps) => {
    return (
        <div className="slot" data-swapy-slot={slotId}>
            <div
                className="item quick-domain-row"
                key={`item-${domain.id}`}
                data-swapy-item={itemId}
            >
                <div className="drag-handle">
                    <GripVertical size={18} />
                </div>

                <div className="domain-content" data-swapy-no-drag>
                    <div className="domain-name">{domain.name}</div>
                    <div className="domain-value">{domain.domain}</div>
                </div>

                <div className="domain-actions" data-swapy-no-drag>
                    <button
                        onClick={() => onDomainClick(domain.domain)}
                        className="btn btn-primary-outline"
                        title="Use this domain"
                    >
                        Use
                    </button>
                    <button
                        onClick={() => onEdit(domain)}
                        className="btn btn-secondary-outline"
                        data-swapy-no-drag
                        title="Edit domain"
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => onDelete(domain.id)}
                        className="btn btn-danger-outline"
                        data-swapy-no-drag
                        title="Delete domain"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    )
}
