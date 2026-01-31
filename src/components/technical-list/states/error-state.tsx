import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon } from "@hugeicons/core-free-icons";

interface ErrorStateProps {
    message: string;
}

export const ErrorState = ({ message }: ErrorStateProps) => (
    <div className="flex flex-col items-center gap-3 py-12 shadow-sm">
        <HugeiconsIcon
            icon={AlertCircleIcon}
            size={32}
            color="currentColor"
            strokeWidth={1.6}
        />
        <span className="text-sm">{message}</span>
    </div>
);
