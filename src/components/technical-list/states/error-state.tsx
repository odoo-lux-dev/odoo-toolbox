import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon } from "@hugeicons/core-free-icons";

interface ErrorStateProps {
    message: string;
}

export const ErrorState = ({ message }: ErrorStateProps) => (
    <div className="shadow-sm flex flex-col py-12 items-center gap-3">
        <HugeiconsIcon
            icon={AlertCircleIcon}
            size={32}
            color="currentColor"
            strokeWidth={1.6}
        />
        <span className="text-sm">{message}</span>
    </div>
);
