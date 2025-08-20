import { History } from "lucide-preact"
import { route } from "preact-router"
import {
    resetRpcQuery,
    resetRpcResult,
    setCallMethodName,
    setCreateValues,
    setRpcQuery,
    setWriteValues,
} from "@/contexts/devtools-signals"
import { useDevToolsNotifications } from "@/hooks/use-devtools-notifications"
import type { HistoryAction } from "@/types"

interface HistoryActionRestoreProps {
    action: HistoryAction
}

/**
 * Component to restore a history action
 * Navigates to the appropriate tab and restores the parameters
 */
export const HistoryActionRestore = ({ action }: HistoryActionRestoreProps) => {
    const { showNotification } = useDevToolsNotifications()

    const handleRestore = async () => {
        try {
            resetRpcQuery()
            resetRpcResult()

            switch (action.type) {
                case "search":
                    await restoreSearchAction(action)
                    break
                case "write":
                    await restoreWriteAction(action)
                    break
                case "create":
                    await restoreCreateAction(action)
                    break
                case "call-method":
                    await restoreCallMethodAction(action)
                    break
                case "unlink":
                    await restoreUnlinkAction(action)
                    break
            }

            showNotification(
                `Restored ${action.type} action for ${action.model}`,
                "success"
            )
        } catch (error) {
            showNotification(
                `Failed to restore action: ${error instanceof Error ? error.message : "Unknown error"}`,
                "error", 10000
            )
        }
    }

    const restoreSearchAction = async (action: HistoryAction) => {
        if (action.type !== "search") return

        const { model, domain, selectedFields, ids, limit, offset, orderBy } =
            action.parameters

        setRpcQuery({
            model,
            domain,
            selectedFields,
            ids,
            limit,
            offset,
            orderBy,
        })

        route("/search")
    }

    const restoreWriteAction = async (action: HistoryAction) => {
        if (action.type !== "write") return

        const { model, ids, values } = action.parameters

        setRpcQuery({
            model,
            ids,
            domain: "[]",
            selectedFields: [],
            limit: 80,
            offset: 0,
            orderBy: "",
        })

        setWriteValues(JSON.stringify(values, null, 2))

        route("/write")
    }

    const restoreCreateAction = async (action: HistoryAction) => {
        if (action.type !== "create") return

        const { model, values } = action.parameters

        setRpcQuery({
            model,
            domain: "[]",
            selectedFields: [],
            ids: "",
            limit: 80,
            offset: 0,
            orderBy: "",
        })

        setCreateValues(JSON.stringify(values, null, 2))

        route("/create")
    }

    const restoreCallMethodAction = async (action: HistoryAction) => {
        if (action.type !== "call-method") return

        const { model, ids, method } = action.parameters

        setRpcQuery({
            model,
            ids,
            domain: "[]",
            selectedFields: [],
            limit: 80,
            offset: 0,
            orderBy: "",
        })

        setCallMethodName(method)

        route("/call-method")
    }

    const restoreUnlinkAction = async (action: HistoryAction) => {
        if (action.type !== "unlink") return

        const { model, ids } = action.parameters

        setRpcQuery({
            model,
            ids,
            domain: "[]",
            selectedFields: [],
            limit: 80,
            offset: 0,
            orderBy: "",
        })

        route("/unlink")
    }

    return (
        <div className="history-action-restore">
            <button
                type="button"
                className="btn btn-secondary-outline restore-btn"
                onClick={handleRestore}
                title={`This will navigate to the ${action.type} tab and restore the parameters.`}
            >
                <History size={14} />
                Restore
            </button>
        </div>
    )
}
