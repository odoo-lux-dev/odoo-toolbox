import { HugeiconsIcon } from "@hugeicons/react";
import { Copy01Icon } from "@hugeicons/core-free-icons";
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
            <div className="flex items-center justify-center rounded-lg border border-base-200 bg-base-100 px-4 py-8 text-sm text-base-content/70">
                Loading record data...
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-error shadow-sm">
                <span className="text-sm">{error}</span>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="alert alert-warning shadow-sm">
                <span className="text-sm">No data available</span>
            </div>
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
                    className="absolute right-3 top-3 bg-base-100/80 shadow-sm backdrop-blur"
                    icon={
                        <HugeiconsIcon
                            icon={Copy01Icon}
                            size={14}
                            color="currentColor"
                            strokeWidth={1.6}
                        />
                    }
                />
                <pre className="max-h-[420px] overflow-auto rounded-lg border border-base-300 bg-base-200/50 p-4 text-xs leading-6 text-base-content">
                    {jsonString}
                </pre>
            </div>
        </div>
    );
};
