import { createContext } from "preact"
import { useContext } from "preact/hooks"
import type { TechnicalSidebarContextType } from "@/types"

const TechnicalSidebarContext =
    createContext<TechnicalSidebarContextType | null>(null)

export const useTechnicalSidebarContext = () => {
    const context = useContext(TechnicalSidebarContext)
    if (!context) {
        throw new Error(
            "useTechnicalSidebarContext must be used within a TechnicalSidebarProvider"
        )
    }
    return context
}

export { TechnicalSidebarContext }
export type { TechnicalSidebarContextType }
