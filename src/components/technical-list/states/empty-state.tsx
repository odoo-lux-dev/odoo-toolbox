interface EmptyStateProps {
    icon: string;
    message: string;
}

export const EmptyState = ({ icon, message }: EmptyStateProps) => (
    <div className="x-odoo-technical-list-info-empty">
        <i className={`fa ${icon}`} />
        <span>{message}</span>
    </div>
);
