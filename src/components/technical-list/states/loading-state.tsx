interface LoadingStateProps {
  message?: string
}

export const LoadingState = ({
  message = "Scanning technical fields...",
}: LoadingStateProps) => (
  <div className="x-odoo-technical-list-info-loading">
    <i className="fa fa-spinner fa-spin" />
    <span>{message}</span>
  </div>
)
