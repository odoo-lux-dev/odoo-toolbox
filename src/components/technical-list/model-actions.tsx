import { useSignal } from "@preact/signals"
import { KeyRound, List, Shield } from "lucide-preact"
import {
    getModelAccessIds,
    getModelFieldIds,
    getModelRuleIds,
    openViewWithIds,
} from "@/services/content-script-rpc-service"

interface ModelActionsProps {
    currentModel: string
}

export const ModelActions = ({ currentModel }: ModelActionsProps) => {
    const loading = useSignal<string | null>(null)

    const doActionFunction =
        window.odoo?.__WOWL_DEBUG__?.root?.actionService?.doAction ??
        window.odoo?.__WOWL_DEBUG__?.root?.env?.services?.action?.doAction ??
        window.odoo?.__DEBUG__?.services?.["web.web_client"]?.do_action

    if (!doActionFunction || typeof doActionFunction !== "function") {
        return null
    }

    const handleViewFields = async () => {
        loading.value = "fields"
        try {
            const fieldIds = await getModelFieldIds(currentModel)
            await openViewWithIds(
                "ir.model.fields",
                fieldIds,
                `Odoo Toolbox - ${currentModel} fields`
            )
        } catch (error) {
            alert(error)
        } finally {
            loading.value = null
        }
    }

    const handleViewRules = async () => {
        loading.value = "rules"
        try {
            const ruleIds = await getModelRuleIds(currentModel)
            await openViewWithIds(
                "ir.rule",
                ruleIds,
                `Odoo Toolbox - ${currentModel} access rules`
            )
        } catch (error) {
            alert(error)
        } finally {
            loading.value = null
        }
    }

    const handleViewAccess = async () => {
        loading.value = "access"
        try {
            const accessIds = await getModelAccessIds(currentModel)
            await openViewWithIds(
                "ir.model.access",
                accessIds,
                `Odoo Toolbox - ${currentModel} model access`
            )
        } catch (error) {
            alert(error)
        } finally {
            loading.value = null
        }
    }

    return (
        <div className="x-odoo-model-actions">
            <button
                className="x-odoo-model-action-btn"
                onClick={handleViewFields}
                disabled={loading.value !== null}
                title="View model fields (ir.model.fields)"
            >
                <List size={16} />
                {loading.value === "fields" ? "Loading..." : "View Fields"}
            </button>
            <button
                className="x-odoo-model-action-btn"
                onClick={handleViewRules}
                disabled={loading.value !== null}
                title="View access rules (ir.rule)"
            >
                <Shield size={16} />
                {loading.value === "rules" ? "Loading..." : "View Rules"}
            </button>
            <button
                className="x-odoo-model-action-btn"
                onClick={handleViewAccess}
                disabled={loading.value !== null}
                title="View model access (ir.model.access)"
            >
                <KeyRound size={16} />
                {loading.value === "access" ? "Loading..." : "View Access"}
            </button>
        </div>
    )
}
