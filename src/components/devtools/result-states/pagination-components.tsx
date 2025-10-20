import "@/components/devtools/result-states/pagination-components.style.scss";
import { ArrowLeft, ArrowRight } from "lucide-preact";
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
        <div className="pagination-inline">
            <button
                className={`pagination-inline-btn ${loading ? "loading" : ""}`}
                onClick={pagination.goToPreviousPage}
                disabled={pagination.currentPage === 1 || loading}
            >
                <ArrowLeft size={16} />
            </button>
            <span className="page-info">
                Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
                className={`pagination-inline-btn ${loading ? "loading" : ""}`}
                onClick={pagination.goToNextPage}
                disabled={
                    pagination.currentPage === pagination.totalPages || loading
                }
            >
                <ArrowRight size={16} />
            </button>
        </div>
    );
};

export const PaginationInfo = () => {
    const pagination = usePagination();

    return (
        <span className="record-count">
            {pagination.totalPages > 1 &&
            pagination.startRecord &&
            pagination.endRecord
                ? `${pagination.startRecord}-${pagination.endRecord} / ${pagination.totalCount || 0} record(s)`
                : `${pagination.data?.length || 0} record(s) found`}
        </span>
    );
};
