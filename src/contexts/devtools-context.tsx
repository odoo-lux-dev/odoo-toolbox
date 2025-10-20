import { createContext, useContext } from "preact/compat";
import type { DevToolsContextValue } from "@/types";

export const DevToolsContext = createContext<DevToolsContextValue | null>(null);

export const useDevToolsContext = (): DevToolsContextValue => {
    const context = useContext(DevToolsContext);
    if (!context) {
        throw new Error(
            "useDevToolsContext must be used within a DevToolsProvider",
        );
    }
    return context;
};
