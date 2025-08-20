import { useCallback } from "preact/hooks"
import { ERROR_NOTIFICATION_TIMEOUT } from "@/components/shared/notifications/notifications"
import { useDevToolsContext } from "@/contexts/devtools-context"
import { executeQuery, setRpcQuery } from "@/contexts/devtools-signals"
import { Logger } from "@/services/logger"
import { odooRpcService } from "@/services/odoo-rpc-service"
import { GetCurrentPageResult } from "@/types"
import { getCurrentPageAndProcess } from "@/utils/current-page-utils"

interface GetCurrentPageOptions {
    showNotifications?: boolean
    autoExecute?: boolean
    onSuccess?: (result: GetCurrentPageResult) => void
    onError?: (error: Error) => void
}

/**
 * Hook pour récupérer et appliquer les informations de la page Odoo actuelle
 */
export const useGetCurrentPage = () => {
    const { showNotification } = useDevToolsContext()

    const getAndApplyCurrentPage = useCallback(
        async (options: GetCurrentPageOptions = {}) => {
            const {
                showNotifications = true,
                autoExecute = false,
                onSuccess,
                onError,
            } = options

            try {
                const result = await getCurrentPageAndProcess(
                    () => odooRpcService.getCurrentPageInfo(),
                    showNotifications ? showNotification : undefined
                )

                if (result) {
                    setRpcQuery(result.updates)

                    if (autoExecute) {
                        try {
                            await executeQuery(true, result.updates)
                        } catch (executeError) {
                            Logger.error(
                                "Error executing automatic query:",
                                executeError
                            )
                            if (showNotifications && showNotification) {
                                showNotification(
                                    "Failed to execute automatic search",
                                    "error",
                                    ERROR_NOTIFICATION_TIMEOUT
                                )
                            }
                        }
                    }

                    onSuccess?.(result)
                    return result
                } else {
                    onError?.(new Error("No model found on current page"))
                    return null
                }
            } catch (error) {
                const errorMessage =
                    error instanceof Error
                        ? error
                        : new Error("Failed to get current page information")
                onError?.(errorMessage)
                return null
            }
        },
        [showNotification]
    )

    return { getAndApplyCurrentPage }
}
