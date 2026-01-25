import { HugeiconsIcon } from "@hugeicons/react";
import { Alert01Icon, Refresh01Icon } from "@hugeicons/core-free-icons";
import { IconButton } from "@/components/ui/icon-button";

interface RefreshButtonProps {
    loading: boolean;
    error: string;
    hasOptions: boolean;
    disabled: boolean;
    onRefresh?: () => void;
}

export const RefreshButton = ({
    loading,
    error,
    hasOptions,
    disabled,
    onRefresh,
}: RefreshButtonProps) => {
    if (!onRefresh) return null;

    if (loading) {
        return (
            <IconButton
                className="absolute right-2 top-1/2 -translate-y-1/2 text-base-content/60"
                label="Refreshing list"
                title="Refreshing list"
                type="button"
                disabled={true}
                variant="ghost"
                size="xs"
                circle={false}
                loading={true}
                icon={null}
            />
        );
    }

    if (error) {
        return (
            <IconButton
                className="absolute right-2 top-1/2 -translate-y-1/2 text-warning hover:text-warning/80"
                label={`Error: ${error}. You can try again or enter your value manually.`}
                onClick={onRefresh}
                title={`Error: ${error}\n\nYou can try again (by clicking this button) or enter your value manually.`}
                type="button"
                disabled={disabled}
                variant="ghost"
                size="xs"
                circle={false}
                icon={
                    <HugeiconsIcon
                        icon={Alert01Icon}
                        size={16}
                        color="currentColor"
                        strokeWidth={1.6}
                    />
                }
            />
        );
    }

    if (hasOptions) {
        return (
            <IconButton
                className="absolute right-2 top-1/2 -translate-y-1/2 text-base-content/60 hover:text-base-content"
                label="Refresh list"
                onClick={onRefresh}
                title="Refresh list"
                type="button"
                disabled={disabled}
                variant="ghost"
                size="xs"
                circle={false}
                icon={
                    <HugeiconsIcon
                        icon={Refresh01Icon}
                        size={16}
                        color="currentColor"
                        strokeWidth={1.6}
                    />
                }
            />
        );
    }

    return null;
};
