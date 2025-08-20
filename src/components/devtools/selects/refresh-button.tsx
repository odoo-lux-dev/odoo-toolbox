import { RefreshCw, TriangleAlert } from "lucide-preact"

interface RefreshButtonProps {
    loading: boolean
    error: string
    hasOptions: boolean
    disabled: boolean
    onRefresh?: () => void
}

export const RefreshButton = ({ loading, error, hasOptions, disabled, onRefresh }: RefreshButtonProps) => {
    if (!onRefresh) return null

    if (loading) {
        return (
            <div className="loading-spinner">
                <RefreshCw size={16} />
            </div>
        )
    }

    if (error) {
        return (
            <button
                className="refresh-button error"
                onClick={onRefresh}
                title={`Error: ${error}\n\nYou can try again (by clicking this button) or enter your value manually.`}
                type="button"
                disabled={disabled}
            >
                <TriangleAlert size={16} />
            </button>
        )
    }

    if (hasOptions) {
        return (
            <button
                className="refresh-button"
                onClick={onRefresh}
                title="Refresh list"
                type="button"
                disabled={disabled}
            >
                <RefreshCw size={16} />
            </button>
        )
    }

    return null
}
