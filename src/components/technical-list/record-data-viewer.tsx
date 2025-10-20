import { Copy } from "lucide-preact";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";

interface RecordDataViewerProps {
    data: Record<string, unknown> | null;
    loading: boolean;
    error: string | null;
}

/**
 * Renders record data as formatted JSON with copy functionality
 */
export const RecordDataViewer = ({
    data,
    loading,
    error,
}: RecordDataViewerProps) => {
    const { copyToClipboard } = useCopyToClipboard();

    if (loading) {
        return (
            <div className="x-odoo-modal-loading">Loading record data...</div>
        );
    }

    if (error) {
        return <div className="x-odoo-modal-error">{error}</div>;
    }

    if (!data) {
        return <div className="x-odoo-modal-error">No data available</div>;
    }

    const jsonString = JSON.stringify(data, null, 2);

    const handleCopy = (e: MouseEvent) => {
        const target = e.currentTarget as HTMLElement;
        copyToClipboard(jsonString, target);
    };

    return (
        <div className="x-odoo-record-data-json">
            <div className="x-odoo-json-container">
                <button
                    className="x-odoo-json-copy-btn"
                    onClick={handleCopy}
                    title="Copy JSON to clipboard"
                >
                    <Copy size={14} />
                </button>
                <pre className="x-odoo-json-display">{jsonString}</pre>
            </div>
        </div>
    );
};
