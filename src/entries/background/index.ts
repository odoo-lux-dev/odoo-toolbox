import { alarms, checkAndHandleAlarms } from "@/entries/background/alarms";
import { commands } from "@/entries/background/commands";
import { handleDevToolsMessage } from "@/entries/background/devtools";
import { configurationService } from "@/services/configuration-service";
import { updateService } from "@/services/update-service";

export default defineBackground(() => {
    browser.runtime.onStartup.addListener(async () => {
        await configurationService.alignLocalDataWithSyncedData();
        checkAndHandleAlarms();
    });

    browser.runtime.onInstalled.addListener(async (details) => {
        await configurationService.alignLocalDataWithSyncedData();
        checkAndHandleAlarms();

        if (details.reason === "update" && details.previousVersion) {
            const currentVersion = browser.runtime.getManifest().version;
            const previousVersion = details.previousVersion;

            if (
                updateService.shouldShowUpdatePage(
                    currentVersion,
                    previousVersion,
                )
            ) {
                browser.windows.getCurrent().then((currentWindow) => {
                    const width = 400;
                    const height = 800;

                    const left =
                        (currentWindow.width ? currentWindow.width : 1920) / 2 -
                        width / 2;
                    const top =
                        (currentWindow.height ? currentWindow.height : 1080) /
                            2 -
                        height / 2 -
                        100;

                    browser.windows.create({
                        url: browser.runtime.getURL("/update.html"),
                        width,
                        height,
                        type: "popup",
                        focused: true,
                        left: Math.round(left),
                        top: Math.round(top),
                    });
                });
            }
        }
    });

    browser.alarms.onAlarm.addListener((alarm) => {
        const alarmInstance = alarms.find((a) => a.getName() === alarm.name);
        if (alarmInstance) alarmInstance.execute();
    });

    browser.commands.onCommand.addListener((command) => {
        const commandInstance = commands.find((c) => c.getName() === command);
        if (commandInstance) commandInstance.execute();
    });

    // Handle DevTools messages
    browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.tabId && request.scriptId) {
            handleDevToolsMessage(request, sendResponse);
            return true;
        }
        return false;
    });

    browser.runtime.onMessageExternal.addListener(
        (request, sender, sendResponse) => {
            const currentBrowser = import.meta.env.BROWSER;
            const isChromiumBased = ["chrome", "edge", "opera"].includes(
                currentBrowser,
            );

            const publicExtensionId = isChromiumBased
                ? "fkgeepkgoihjhiinffddgjmdkhelpnfo"
                : "odoo_sh_extension@thcl-saju";

            if (sender.id !== publicExtensionId) {
                return sendResponse({
                    status: "error",
                    message: "Unauthorized request from external extension",
                });
            }

            configurationService
                .importConfiguration(request.config)
                .then(() => {
                    sendResponse({
                        status: "success",
                        message: "Configuration migrated successfully",
                    });
                })
                .catch((error: unknown) => {
                    sendResponse({
                        status: "error",
                        message: `Failed to migrate configuration: ${error instanceof Error ? error.message : String(error)}`,
                    });
                });
        },
    );
});
