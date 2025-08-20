import { useEffect, useRef } from "preact/hooks"
import { setRpcQuery } from "@/contexts/devtools-signals"
import { useRpcQuery, useRpcResult } from "@/contexts/devtools-signals-hook"

/**
 * Hook for auto-syncing IDs with result data and managing manual ID editing.
 *
 * Features:
 * - Auto-sync IDs with query results when IDs field is empty
 * - Reset offset when IDs are manually edited (to view specific records)
 * - Track manual editing state for intelligent behavior
 *
 * Used by tabs that need to track and modify record IDs (Write, Call Method, Unlink)
 */
export const useQueryIds = () => {
    const { result: rpcResult } = useRpcResult()
    const { query: rpcQuery } = useRpcQuery()

    // Track the last offset for reference
    const lastOffsetRef = useRef<number>(rpcQuery.offset)
    // Track if IDs were manually edited
    const manuallyEditedRef = useRef<boolean>(false)

    // Detect when IDs are manually edited (not empty and different from auto-sync)
    useEffect(() => {
        if (rpcQuery.ids.trim() && rpcResult.data) {
            const autoSyncIds = rpcResult.data
                .map((record) => record.id)
                .join(", ")
            if (rpcQuery.ids !== autoSyncIds) {
                manuallyEditedRef.current = true
                // Reset offset when IDs are manually edited to see the specific records
                if (rpcQuery.offset > 0) {
                    setRpcQuery({ offset: 0 })
                }
            }
        }
    }, [rpcQuery.ids, rpcResult.data])

    // Track offset changes for reference
    useEffect(() => {
        lastOffsetRef.current = rpcQuery.offset
    }, [rpcQuery.offset])

    // Auto-sync with rpcResult.data when it changes (only if IDs are empty)
    useEffect(() => {
        if (
            rpcResult.data &&
            rpcResult.data.length > 0 &&
            !rpcQuery.ids.trim()
        ) {
            // Only auto-sync if the query IDs are empty (not manually set)
            const idsString = rpcResult.data
                .map((record) => record.id)
                .join(", ")
            setRpcQuery({ ids: idsString })
            manuallyEditedRef.current = false // Reset manual edit flag
        }
    }, [rpcResult.data])

    const clearIds = () => {
        setRpcQuery({ ids: "" })
        manuallyEditedRef.current = false
    }

    return {
        queryIds: rpcQuery.ids,
        clearIds,
    }
}
