import type {
    GetCurrentPageResult,
    NotificationFunction,
    PageInfo,
    RpcQueryState,
} from "@/types"
import { calculateQueryValidity } from "@/utils/query-validation"

/**
 * Determines if page information justifies auto-execution
 */
export const shouldAutoExecuteQuery = (pageInfo: PageInfo): boolean => {
    // Auto-execute if we have IDs or a significant domain
    return !!(
        (pageInfo.recordIds && pageInfo.recordIds.length > 0) ||
        (pageInfo.domain &&
            Array.isArray(pageInfo.domain) &&
            pageInfo.domain.length > 0)
    )
}

/**
 * Utility function to process current page information
 * and generate appropriate updates for RPC state
 */
export const processCurrentPageInfo = (
    pageInfo: PageInfo,
    showNotification?: NotificationFunction
): GetCurrentPageResult | null => {
    if (!pageInfo.model) {
        // No record found
        showNotification?.("No record found on current page", "warning")
        return null
    }

    // Apply retrieved information
    const updates: Partial<RpcQueryState> = {
        model: pageInfo.model,
    }

    if (pageInfo.recordIds && pageInfo.recordIds.length > 0) {
        updates.ids = pageInfo.recordIds.join(",")
        updates.domain = ""

        const recordCount = pageInfo.recordIds.length
        showNotification?.(
            `Found ${recordCount} record${recordCount > 1 ? "s" : ""} (${pageInfo.viewType || "unknown"} view)`,
            "success"
        )
    } else if (pageInfo.domain) {
        updates.domain = JSON.stringify(pageInfo.domain)
        updates.ids = ""

        showNotification?.(
            `Found list view with domain filter for model: ${pageInfo.model}`,
            "success"
        )
    } else {
        updates.ids = ""
        updates.domain = ""

        showNotification?.(
            `Found model: ${pageInfo.model} (no specific records)`,
            "info"
        )
    }

    // Calculate validity using updates with default values
    const isValid = calculateQueryValidity({
        ...updates,
        limit: 80,
        offset: 0,
    })

    updates.isQueryValid = isValid

    return { pageInfo, updates }
}

/**
 * Async utility function to retrieve and process current Odoo page information
 */
export const getCurrentPageAndProcess = async (
    getCurrentPageInfo: () => Promise<PageInfo>,
    showNotification?: NotificationFunction
): Promise<GetCurrentPageResult | null> => {
    try {
        const pageInfo = await getCurrentPageInfo()
        return processCurrentPageInfo(pageInfo, showNotification)
    } catch {
        showNotification?.("Failed to get current page information", "error")
        return null
    }
}
