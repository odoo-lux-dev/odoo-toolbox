import { HugeiconsIcon } from "@hugeicons/react";
import { DragDropVerticalIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { QuickDomain } from "@/types";

interface QuickDomainRowProps {
    domain: QuickDomain;
    slotId: string;
    itemId: string;
    onDomainClick: (domain: string) => void;
    onEdit: (domain: QuickDomain) => void;
    onDelete: (domainId: string) => void;
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
        <div className="slot py-0.5" data-swapy-slot={slotId}>
            <div
                className="item flex items-center gap-3 rounded-md border border-base-300 bg-base-200 p-3"
                key={`item-${domain.id}`}
                data-swapy-item={itemId}
            >
                <div className="drag-handle flex cursor-grab text-base-content/60 hover:text-base-content active:cursor-grabbing">
                    <HugeiconsIcon
                        icon={DragDropVerticalIcon}
                        size={18}
                        color="currentColor"
                        strokeWidth={4}
                    />
                </div>

                <div
                    className="domain-content min-w-0 flex-1"
                    data-swapy-no-drag
                >
                    <div className="domain-name truncate text-sm font-semibold text-base-content">
                        {domain.name}
                    </div>
                    <div
                        title={domain.domain}
                        className="domain-value truncate text-xs/relaxed break-all text-base-content/70"
                    >
                        {domain.domain}
                    </div>
                </div>

                <div
                    className="domain-actions flex shrink-0 items-center gap-2"
                    data-swapy-no-drag
                >
                    <Button
                        onClick={() => onDomainClick(domain.domain)}
                        variant="outline"
                        color="primary"
                        size="sm"
                        title="Use this domain"
                    >
                        Use
                    </Button>
                    <Button
                        onClick={() => onEdit(domain)}
                        variant="outline"
                        color="secondary"
                        size="sm"
                        data-swapy-no-drag
                        title="Edit domain"
                    >
                        Edit
                    </Button>
                    <Button
                        onClick={() => onDelete(domain.id)}
                        variant="outline"
                        color="error"
                        size="sm"
                        data-swapy-no-drag
                        title="Delete domain"
                    >
                        Delete
                    </Button>
                </div>
            </div>
        </div>
    );
};
