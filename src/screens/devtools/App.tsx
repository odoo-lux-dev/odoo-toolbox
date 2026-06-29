import "./style.css";
import { createEffect, onCleanup } from "solid-js";
import { ToastProvider, Toaster } from "solid-notifications";

import {
  executeQuery,
  hasHostPermission,
  setDatabaseSignal,
  setHasHostPermission,
  setIsSupportedSignal,
  setOdooVersionSignal,
  setRpcQuery,
} from "@/screens/devtools/devtools-signals";
import { Logger } from "@/services/logger";
import { odooRpcService } from "@/services/odoo-rpc-service";
import { settingsService } from "@/services/settings-service";
import { getCurrentPageAndProcess } from "@/utils/current-page-utils";

import { DevToolsContent } from "./Content";

export const DevtoolsApp = () => {
  createEffect(() => {
    let isMounted = true;

    const applyTheme = (extensionTheme?: string) => {
      const themeName = extensionTheme === "light" ? "odoolight" : "odoodark";
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

    onCleanup(() => {
      isMounted = false;
      unwatch();
    });
  });

  createEffect(() => {
    const refreshOdooInfo = async () => {
      try {
        setHasHostPermission(await odooRpcService.checkHostPermission());

        if (!hasHostPermission()) {
          return;
        }

        const [supported, odooInfo] = await Promise.all([
          odooRpcService.isOdooVersionSupported(),
          odooRpcService.getRpcOdooInfo(),
        ]);

        const version = odooInfo.version ? String(odooInfo.version) : null;

        if (version) {
          setOdooVersionSignal(version);
        }
        setIsSupportedSignal(supported);

        if (odooInfo.database) {
          setDatabaseSignal(odooInfo.database);
        } else {
          setDatabaseSignal(undefined);
        }

        if (supported) {
          try {
            const result = await getCurrentPageAndProcess(() =>
              odooRpcService.getCurrentPageInfo(),
            );

            if (result?.updates.isQueryValid) {
              setRpcQuery(result.updates);
              try {
                await executeQuery(true, result.updates);
              } catch (queryError) {
                Logger.warn("Failed to auto-execute query on initialization:", queryError);
              }
            }
          } catch (pageError) {
            Logger.warn("Failed to get current page info on initialization:", pageError);
          }
        }
      } catch (error) {
        Logger.warn("Failed to initialize DevTools:", error);
        setIsSupportedSignal(false);
        setDatabaseSignal(undefined);
      }
    };

    refreshOdooInfo();

    if (browser.devtools.network.onNavigated) {
      const handleNavigation = async (_url: string) => {
        await refreshOdooInfo();
      };

      browser.devtools.network.onNavigated.addListener(handleNavigation);

      onCleanup(() => {
        browser.devtools.network.onNavigated.removeListener(handleNavigation);
      });
    }
  });

  return (
    <>
      <ToastProvider>
        <DevToolsContent />
        <Toaster
          positionY="top"
          positionX="right"
          offsetX={16}
          offsetY={16}
          gutter={8}
          duration={5000}
          showProgressBar
          pauseOnHover
          showDismissButton
          showIcon
          theme={null}
          style={() => ({
            "background-color": "var(--color-base-100)",
            color: "var(--color-base-content)",
          })}
          progressBarStyle={{ height: "3px" }}
        />
      </ToastProvider>
    </>
  );
};
