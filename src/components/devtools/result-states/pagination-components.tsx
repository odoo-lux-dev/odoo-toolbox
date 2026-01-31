import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";

import { usePagination } from "@/components/devtools/hooks/use-pagination";

interface PaginationControlsProps {
    loading?: boolean;
}

export const PaginationControls = ({
    loading = false,
}: PaginationControlsProps) => {
    const pagination = usePagination();

    if (pagination.totalPages <= 1) {
        return null;
    }

    return (
        <div className="flex items-center gap-2">
            <div className="join">
                <button
                    className="btn join-item btn-ghost btn-xs"
                    onClick={pagination.goToPreviousPage}
                    disabled={pagination.currentPage === 1 || loading}
                >
                    <HugeiconsIcon
                        icon={ArrowLeft01Icon}
                        size={16}
                        color="currentColor"
                        strokeWidth={1.6}
                    />
                </button>
                <span className="btn pointer-events-none join-item font-normal tabular-nums btn-ghost btn-xs">
                    Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <button
                    className="btn join-item btn-ghost btn-xs"
                    onClick={pagination.goToNextPage}
                    disabled={
                        pagination.currentPage === pagination.totalPages ||
                        loading
                    }
                >
                    <HugeiconsIcon
                        icon={ArrowRight01Icon}
                        size={16}
                        color="currentColor"
                        strokeWidth={1.6}
                    />
                </button>
            </div>
        </div>
    );
};

export const PaginationInfo = () => {
    const pagination = usePagination();

    return (
        <span className="text-xs text-base-content/70 tabular-nums">
            {pagination.totalPages > 1 &&
            pagination.startRecord &&
            pagination.endRecord
                ? `${pagination.startRecord}-${pagination.endRecord} / ${pagination.totalCount || 0} record(s)`
                : `${pagination.data?.length || 0} record(s) found`}
        </span>
    );
};
