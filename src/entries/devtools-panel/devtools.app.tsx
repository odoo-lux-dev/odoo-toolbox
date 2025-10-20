import "./style.scss";
import { DevToolsProvider } from "@/contexts/devtools-provider";
import { DevToolsContent } from "./devtools.content";

export const DevtoolsApp = () => {
    return (
        <DevToolsProvider>
            <DevToolsContent />
        </DevToolsProvider>
    );
};
