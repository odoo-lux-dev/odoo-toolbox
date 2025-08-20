import { createContext } from "preact"
import { useContext } from "preact/hooks"

interface LevelContextValue {
    level: number
}

const LevelContext = createContext<LevelContextValue | undefined>(undefined)

interface LevelProviderProps {
    level: number
    children: preact.ComponentChildren
}

export const LevelProvider = ({ level, children }: LevelProviderProps) => {
    return (
        <LevelContext.Provider value={{ level }}>
            {children}
        </LevelContext.Provider>
    )
}

export const useLevel = (): number => {
    const context = useContext(LevelContext)
    if (context === undefined) {
        return 0 // Default level if no provider
    }
    return context.level
}
