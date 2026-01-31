import { HugeiconsIcon } from "@hugeicons/react";
import { Copy01Icon } from "@hugeicons/core-free-icons";
import { Alert } from "@/components/ui/alert";
import { IconButton } from "@/components/ui/icon-button";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";

interface RecordDataViewerProps {
    data: Record<string, unknown> | null;
    loading: boolean;
    error: string | null;
}

/**
 * Renders record data as formatted JSON with copy functionality.
 */
export const RecordDataViewer = ({
    data,
    loading,
    error,
}: RecordDataViewerProps) => {
    const { copyToClipboard } = useCopyToClipboard();

    if (loading) {
        return (
            <Alert
                title="Loading record data..."
                color="info"
                variant="outline"
                className="items-start"
            >
                <span className="text-sm">Please wait a moment.</span>
            </Alert>
        );
    }

    if (error) {
        return (
            <Alert color="error" variant="outline" className="items-start">
                <span className="text-sm">{error}</span>
            </Alert>
        );
    }

    if (!data) {
        return (
            <Alert color="warning" variant="outline" className="items-start">
                <span className="text-sm">No data available</span>
            </Alert>
        );
    }

    const jsonString = JSON.stringify(data, null, 2);

    const handleCopy = (event: MouseEvent) => {
        const target = event.currentTarget as HTMLElement;
        copyToClipboard(jsonString, target);
    };

    return (
        <div className="space-y-3">
            <div className="relative">
                <IconButton
                    label="Copy JSON to clipboard"
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="absolute top-3 right-3 bg-base-100/80 shadow-sm backdrop-blur-sm"
                    icon={
                        <HugeiconsIcon
                            icon={Copy01Icon}
                            size={14}
                            color="currentColor"
                            strokeWidth={1.6}
                        />
                    }
                />
                <pre className="mt-2 max-h-105 overflow-auto rounded-lg border border-base-300 bg-base-200/50 p-3 text-xs/6 text-base-content">
                    {jsonString}
                </pre>
            </div>
        </div>
    );
};
