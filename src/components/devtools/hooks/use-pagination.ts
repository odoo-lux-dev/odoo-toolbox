import { executeQuery, setRpcQuery } from "@/contexts/devtools-signals"
import { useRpcQuery, useRpcResult } from "@/contexts/devtools-signals-hook"

export const usePagination = () => {
    const { query: rpcQuery } = useRpcQuery()
    const { result: rpcResult } = useRpcResult()
    const { totalCount } = rpcResult

    const effectiveLimit = rpcResult.lastQuery?.limit || rpcQuery.limit
    const effectiveOffset = rpcResult.lastQuery?.offset || rpcQuery.offset

    const currentPage = Math.floor(effectiveOffset / effectiveLimit) + 1
    const totalPages = totalCount ? Math.ceil(totalCount / effectiveLimit) : 1
    const startRecord = effectiveOffset + 1
    const endRecord = Math.min(
        effectiveOffset + (rpcResult.data?.length || 0),
        totalCount || 0
    )

    const goToPage = async (page: number) => {
        const newOffset = (page - 1) * rpcQuery.limit

        setRpcQuery({ ids: "" })

        await executeQuery(false, { offset: newOffset })
    }

    const goToPreviousPage = () => {
        if (currentPage > 1) {
            goToPage(currentPage - 1)
        }
    }

    const goToNextPage = () => {
        if (currentPage < totalPages) {
            goToPage(currentPage + 1)
        }
    }

    return {
        totalCount,
        data: rpcResult.data,
        currentPage,
        totalPages,
        startRecord,
        endRecord,
        goToPage,
        goToPreviousPage,
        goToNextPage,
    }
}
