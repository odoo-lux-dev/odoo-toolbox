import { registerContextMenuHandlers } from "@/entries/background/context-menu";
import { handleDevToolsMessage } from "@/entries/background/devtools";
import { handleI18nMessage } from "@/entries/background/i18n";
import { configurationService } from "@/services/configuration-service";
import { debugModeRulesService } from "@/services/debug-mode-rules-service";
import { toggleDebugMode } from "@/services/debug-mode-service";
import {
  DEVTOOLS_PAGE_SCRIPT,
  ODOOSH_ROUTE_CHANGED,
  type OdooShRouteChangedMessage,
} from "@/services/extension-messages";
import { Logger } from "@/services/logger";
import { settingsService } from "@/services/settings-service";
import { updateService } from "@/services/update-service";
import type { ImportedConfig } from "@/utils/config-validation";
import { getDebugModeUrl, isBackendPath } from "@/utils/debug-mode-url";
import { isRunbotBuildHost } from "@/utils/odoo-hosts";

const COMMANDS: Record<string, () => void> = {
  "toggle-debug": () =>
    toggleDebugMode()
      .then(() => Logger.info("Debug mode toggled"))
      .catch((error) => Logger.error("An error occured toggling debug mode", error)),
};

const persistDataToSync = () =>
  configurationService
    .persistDataToSync()
    .catch((error: unknown) =>
      Logger.error("An error occured while saving data to the cloud", error),
    );

const ALARMS: Record<string, { options: { periodInMinutes: number }; fn: () => void }> = {
  "persist-local-data": { options: { periodInMinutes: 1 }, fn: persistDataToSync },
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
  registerContextMenuHandlers();
  debugModeRulesService.start();

  browser.runtime.onStartup.addListener(async () => {
    await configurationService.alignLocalDataWithSyncedData();
    checkAndHandleAlarms();
  });

  browser.runtime.onInstalled.addListener(async (details) => {
    // On an update, the local data just migrated is the reference: the sync copy can be older
    // (persisted every minute, or by another browser) and would revert it.
    if (details.reason === "install") {
      await configurationService.alignLocalDataWithSyncedData();
    } else {
      await persistDataToSync();
    }
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

  browser.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (handleI18nMessage(request, sendResponse)) {
      return true;
    }
    if (request?.type === DEVTOOLS_PAGE_SCRIPT) {
      handleDevToolsMessage(request, sendResponse);
      return true;
    }
    return false;
  });

  // The Odoo.sh SPA navigates with the History API, which content scripts cannot observe.
  browser.webNavigation.onHistoryStateUpdated.addListener((details) => {
    if (details.frameId !== 0) return;
    if (!details.url?.startsWith("https://www.odoo.sh/")) return;

    const message: OdooShRouteChangedMessage = { type: ODOOSH_ROUTE_CHANGED };
    // The content script may not be injected (yet) in that tab.
    browser.tabs.sendMessage(details.tabId, message).catch(() => undefined);
  });

  // Reload fallback of the network rules (see `debugModeRulesService`): for hosts not yet
  // known as Odoo, and URLs carrying another debug mode than the default one.
  browser.webNavigation.onCommitted.addListener(async (details) => {
    if (details.frameId !== 0) return;

    const url = new URL(details.url);
    if (!isBackendPath(url)) return;

    const defaultDebugMode = await settingsService.get("enableDebugMode");
    if (!defaultDebugMode || defaultDebugMode === "disabled") return;

    let currentDebugMode: string;
    try {
      const [result] = await browser.scripting.executeScript({
        target: { tabId: details.tabId },
        world: "MAIN",
        func: () => (typeof window.odoo === "undefined" ? null : (window.odoo.debug ?? "")),
      });
      if (typeof result?.result !== "string") return;
      currentDebugMode = result.result;
    } catch {
      // Non-injectable tab (chrome://, Web Store, etc.)
      return;
    }

    // Learned before any early return: the next pages of the host skip the reload.
    await debugModeRulesService.rememberHost(url.host);

    // On Runbot builds, the page script applies debug mode after auto-login.
    if (isRunbotBuildHost(url.hostname) && (await settingsService.get("runbotAutoLogin"))) {
      return;
    }

    const ignoredPaths = await settingsService.get("ignoredDebugPaths");
    const targetUrl = getDebugModeUrl(url, { defaultDebugMode, ignoredPaths, currentDebugMode });
    if (targetUrl && targetUrl !== details.url) {
      await browser.tabs.update(details.tabId, { url: targetUrl });
    }
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

    // Configs of the legacy extension may hold values the schema no longer accepts: the
    // stores clean them on write, so they are imported instead of rejected as a whole.
    configurationService
      .importConfiguration(request.config as ImportedConfig)
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
