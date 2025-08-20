import { useCallback, useState } from "preact/hooks"
import { Logger } from "@/services/logger"
import { DatabaseInfo } from "@/types"
import { getOdooVersion } from "@/utils/utils"

const formatDebugMode = (debugMode: string | undefined): string => {
    let label

    switch (debugMode) {
        case "1":
            label = "Enabled"
            break
        case "assets":
            label = "Assets"
            break
        case "assets,tests":
            label = "Tests Assets"
            break
        default:
            label = "Disabled"
            break
    }

    return label
}

export const useDatabaseInfo = () => {
    const [dbInfo, setDbInfo] = useState<DatabaseInfo | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchDatabaseInfo = useCallback(async (): Promise<DatabaseInfo> => {
        const odooWindowObject = window.odoo
        if (!odooWindowObject) {
            throw new Error("Odoo object not found")
        }

        return {
            version: getOdooVersion() || "Unknown",
            database:
                odooWindowObject.info?.db ||
                odooWindowObject.session_info?.db ||
                "Unknown",
            serverInfo:
                (odooWindowObject.info || odooWindowObject.session_info)
                    ?.server_version || "Unknown",
            debugMode: formatDebugMode(odooWindowObject.debug),
            language:
                odooWindowObject.__WOWL_DEBUG__?.root?.localization?.code ||
                odooWindowObject.__WOWL_DEBUG__?.root?.user?.lang ||
                odooWindowObject.session_info?.user_context?.lang ||
                "Unknown",
        }
    }, [])

    const refresh = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            const info = await fetchDatabaseInfo()
            setDbInfo(info)
        } catch (err) {
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : "Failed to load database information"
            Logger.error("Failed to get database info:", err)
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }, [fetchDatabaseInfo])

    return {
        dbInfo,
        loading,
        error,
        refresh,
    }
}
