import { JSX } from "preact"
import { useEffect } from "preact/hooks"
import {
  TechnicalSidebarContext,
  TechnicalSidebarContextType,
} from "./technical-sidebar-context"
import { useTechnicalSidebar } from "@/hooks/use-technical-sidebar"
import { useDatabaseInfo } from "@/hooks/use-database-info"

interface TechnicalSidebarProviderProps {
  children: JSX.Element | JSX.Element[]
}

export const TechnicalSidebarProvider = ({
  children,
}: TechnicalSidebarProviderProps) => {
  const sidebarState = useTechnicalSidebar()
  const databaseState = useDatabaseInfo()

  useEffect(() => {
    if (
      sidebarState.isExpanded &&
      !databaseState.dbInfo &&
      !databaseState.loading
    ) {
      databaseState.refresh()
    }
  }, [
    sidebarState.isExpanded,
    databaseState.dbInfo,
    databaseState.loading,
    databaseState.refresh,
  ])

  const isWebsite = sidebarState.viewInfo?.websiteInfo != null
  const hasFields = (sidebarState.viewInfo?.technicalFields?.length || 0) > 0

  const contextValue: TechnicalSidebarContextType = {
    ...sidebarState,
    isWebsite,
    hasFields,
    dbInfo: databaseState.dbInfo,
    dbLoading: databaseState.loading,
    dbError: databaseState.error,
  }

  return (
    <TechnicalSidebarContext.Provider value={contextValue}>
      {children}
    </TechnicalSidebarContext.Provider>
  )
}
