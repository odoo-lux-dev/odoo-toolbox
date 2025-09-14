async function executeOdooRpc<T = unknown>(
    model: string,
    method: string,
    args: unknown[] = [],
    kwargs: Record<string, unknown> = {}
): Promise<T> {
    const endpoint = `/web/dataset/call_kw/${model}/${method}`

    const payload = {
        id: Math.floor(Math.random() * 10000),
        jsonrpc: "2.0",
        method: "call",
        params: {
            args,
            kwargs,
            model,
            method,
        },
    }

    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    })

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()

    if (result.error) {
        throw new Error(result.error.data.message || result.error.message)
    }

    return result.result as T
}

async function searchReadRecords(
    model: string,
    domain: unknown[] = [],
    limit?: number
): Promise<number[]> {
    const result = await executeOdooRpc<Array<{ id: number }>>(
        model,
        "search_read",
        [domain],
        {
            limit,
            fields: ["id"],
        }
    )
    return result.map((record) => record.id)
}

export async function getModelFieldIds(model: string): Promise<number[]> {
    return searchReadRecords("ir.model.fields", [["model", "=", model]])
}

export async function getModelRuleIds(model: string): Promise<number[]> {
    return searchReadRecords("ir.rule", [["model_id.model", "=", model]])
}

export async function getModelAccessIds(model: string): Promise<number[]> {
    return searchReadRecords("ir.model.access", [
        ["model_id.model", "=", model],
    ])
}

/**
 * Open a view with specific record IDs (opens in popup/new window)
 */
export async function openViewWithIds(
    model: string,
    recordIds?: number[],
    title?: string
): Promise<void> {
    const doActionFunction =
        window.odoo?.__WOWL_DEBUG__?.root?.actionService?.doAction ??
        window.odoo?.__WOWL_DEBUG__?.root?.env?.services?.action?.doAction ??
        window.odoo?.__DEBUG__?.services?.["web.web_client"]?.do_action

    if (!doActionFunction || typeof doActionFunction !== "function") {
        throw new Error("Action service not available")
    }

    const action: Record<string, unknown> = {
        name: title,
        type: "ir.actions.act_window",
        res_model: model,
        target: "new",
    }
    if (Array.isArray(recordIds) && recordIds.length > 0) {
        if (recordIds.length === 1) {
            action.res_id = recordIds[0]
            action.views = [[false, "form"]]
        } else {
            action.views = [
                [false, "list"],
                [false, "kanban"],
                [false, "form"],
            ]
            action.domain = [["id", "in", recordIds]]
        }
    } else {
        action.views = [
            [false, "list"],
            [false, "kanban"],
            [false, "form"],
        ]
    }

    await doActionFunction(action, {})
}
