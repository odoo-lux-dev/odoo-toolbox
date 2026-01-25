import "./style.css";
import { useEffect } from "preact/hooks";
import { DevToolsProvider } from "@/contexts/devtools-provider";
import { settingsService } from "@/services/settings-service";
import { DevToolsContent } from "./devtools.content";

export const DevtoolsApp = () => {
    useEffect(() => {
        let isMounted = true;

        const applyTheme = (extensionTheme?: string) => {
            const themeName =
                extensionTheme === "light" ? "odoolight" : "odoodark";
            document.documentElement.setAttribute("data-theme", themeName);
        };

        settingsService.getSettings().then((settings) => {
            if (!isMounted) return;
            applyTheme(settings.extensionTheme);
        });

        const unwatch = settingsService.watchSettings((newSettings) => {
            if (!newSettings) return;
            applyTheme(newSettings.extensionTheme);
        });

        return () => {
            isMounted = false;
            unwatch();
        };
    }, []);

    return (
        <DevToolsProvider>
            <DevToolsContent />
        </DevToolsProvider>
    );
};
