interface ErrorStateProps {
    message: string;
}

export const ErrorState = ({ message }: ErrorStateProps) => (
    <div className="x-odoo-technical-list-info-error">
        <i className="fa fa-exclamation-triangle" />
        <span>{message}</span>
    </div>
);
