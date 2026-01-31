import { ComponentChildren } from "preact";

interface EmptyStateProps {
    icon: ComponentChildren;
    message: string;
}

export const EmptyState = ({ icon, message }: EmptyStateProps) => (
    <div className="flex flex-col items-center gap-3 py-12 shadow-sm">
        {icon}
        <span className="text-sm">{message}</span>
    </div>
);
