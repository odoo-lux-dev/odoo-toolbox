import { KeyRound, List, Shield } from "lucide-preact"
import { useState } from "preact/hooks"
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
    const [loading, setLoading] = useState<string | null>(null)

    const doActionFunction =
        window.odoo?.__WOWL_DEBUG__?.root?.actionService?.doAction ??
        window.odoo?.__WOWL_DEBUG__?.root?.env?.services?.action?.doAction ??
        window.odoo?.__DEBUG__?.services?.["web.web_client"]?.do_action

    if (!doActionFunction || typeof doActionFunction !== "function") {
        return null
    }

    const handleViewFields = async () => {
        setLoading("fields")
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
            setLoading(null)
        }
    }

    const handleViewRules = async () => {
        setLoading("rules")
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
            setLoading(null)
        }
    }

    const handleViewAccess = async () => {
        setLoading("access")
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
            setLoading(null)
        }
    }

    return (
        <div className="x-odoo-model-actions">
            <button
                className="x-odoo-model-action-btn"
                onClick={handleViewFields}
                disabled={loading !== null}
                title="View model fields (ir.model.fields)"
            >
                <List size={16} />
                {loading === "fields" ? "Loading..." : "View Fields"}
            </button>
            <button
                className="x-odoo-model-action-btn"
                onClick={handleViewRules}
                disabled={loading !== null}
                title="View access rules (ir.rule)"
            >
                <Shield size={16} />
                {loading === "rules" ? "Loading..." : "View Rules"}
            </button>
            <button
                className="x-odoo-model-action-btn"
                onClick={handleViewAccess}
                disabled={loading !== null}
                title="View model access (ir.model.access)"
            >
                <KeyRound size={16} />
                {loading === "access" ? "Loading..." : "View Access"}
            </button>
        </div>
    )
}
