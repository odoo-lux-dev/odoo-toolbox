import { ComponentChildren } from "preact";

interface EmptyStateProps {
    icon: ComponentChildren;
    message: string;
}

export const EmptyState = ({ icon, message }: EmptyStateProps) => (
    <div className="shadow-sm flex flex-col py-12 items-center gap-3">
        {icon}
        <span className="text-sm">{message}</span>
    </div>
);
