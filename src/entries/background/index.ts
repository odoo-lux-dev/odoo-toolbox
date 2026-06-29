import { handleDevToolsMessage } from "@/entries/background/devtools";
import { configurationService } from "@/services/configuration-service";
import { Logger } from "@/services/logger";
import { updateService } from "@/services/update-service";
import { handleToggleDebugCommand } from "@/utils/background-utils";

const COMMANDS: Record<string, () => void> = {
  "toggle-debug": () =>
    handleToggleDebugCommand()
      .then(() => Logger.info("Debug mode toggled"))
      .catch((error) => Logger.error("An error occured toggling debug mode", error)),
};

const ALARMS: Record<string, { options: { periodInMinutes: number }; fn: () => void }> = {
  "persist-local-data": {
    options: { periodInMinutes: 1 },
    fn: () =>
      configurationService
        .persistDataToSync()
        .then(() => Logger.info("Data saved to the cloud"))
        .catch((error: unknown) =>
          Logger.error("An error occured while saving data to the cloud", error),
        ),
  },
};

const checkAndHandleAlarms = () => {
  browser.alarms.getAll().then((existingAlarms) => {
    const neededNames = Object.keys(ALARMS);
    const unusedAlarms = existingAlarms.filter((a) => !neededNames.includes(a.name));
    for (const unusedAlarm of unusedAlarms) {
      browser.alarms.clear(unusedAlarm.name).then(() => {
        Logger.info(`Cleared alarm ${unusedAlarm.name}`);
      });
    }
    for (const name of neededNames) {
      if (!existingAlarms.some((a) => a.name === name)) {
        browser.alarms.create(name, ALARMS[name].options);
        Logger.info(`Created alarm ${name}`);
      }
    }
  });
};

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

      if (updateService.shouldShowUpdatePage(currentVersion, previousVersion)) {
        browser.windows.getCurrent().then((currentWindow) => {
          const width = 400;
          const height = 800;

          const left = (currentWindow.width ? currentWindow.width : 1920) / 2 - width / 2;
          const top = (currentWindow.height ? currentWindow.height : 1080) / 2 - height / 2 - 100;

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
    ALARMS[alarm.name]?.fn();
  });

  browser.commands.onCommand.addListener((command) => {
    COMMANDS[command]?.();
  });

  browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.tabId && request.scriptId) {
      handleDevToolsMessage(request, sendResponse);
      return true;
    }
    return false;
  });

  browser.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
    const currentBrowser = import.meta.env.BROWSER;
    const isChromiumBased = ["chrome", "edge", "opera"].includes(currentBrowser);

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
  });
});
