import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon } from "@hugeicons/core-free-icons";

interface LoadingStateProps {
    message?: string;
}

export const LoadingState = ({
    message = "Scanning technical fields...",
}: LoadingStateProps) => (
    <div className="shadow-sm flex flex-col py-12 items-center gap-3">
        <HugeiconsIcon
            icon={Loading03Icon}
            size={32}
            color="currentColor"
            strokeWidth={1.6}
            className="animate-spin"
        />
        <span className="text-sm">{message}</span>
    </div>
);
