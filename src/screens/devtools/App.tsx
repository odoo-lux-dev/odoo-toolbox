import "@/theme/index.css";
import "./style.css";
import { onCleanup, onMount } from "solid-js";
import { ToastProvider, Toaster } from "solid-notifications";

import { ConfirmDialogHost } from "@/components/ui/confirm-dialog";
import { useExtensionTheme } from "@/hooks/use-extension-theme";
import { applyCurrentPage } from "@/screens/devtools/devtools-signals";
import {
  setDatabaseSignal,
  setHasHostPermission,
  setIsSupportedSignal,
  setOdooVersionSignal,
} from "@/screens/devtools/environment";
import { clearFieldsCache } from "@/screens/devtools/fields-metadata";
import { Logger } from "@/services/logger";
import { odooRpcService } from "@/services/odoo-rpc-service";

import { DevToolsContent } from "./Content";

const refreshOdooInfo = async () => {
  clearFieldsCache();
  try {
    const permitted = await odooRpcService.checkHostPermission();
    setHasHostPermission(permitted);
    if (!permitted) return;

    const [supported, odooInfo] = await Promise.all([
      odooRpcService.isOdooVersionSupported(),
      odooRpcService.getRpcOdooInfo(),
    ]);

    if (odooInfo.version) setOdooVersionSignal(String(odooInfo.version));
    setIsSupportedSignal(supported);
    setDatabaseSignal(odooInfo.database || undefined);

    if (supported) await applyCurrentPage(false);
  } catch (error) {
    Logger.warn("Failed to initialize DevTools:", error);
    setIsSupportedSignal(false);
    setDatabaseSignal(undefined);
  }
};

export const DevtoolsApp = () => {
  useExtensionTheme();

  onMount(() => {
    refreshOdooInfo();

    const onNavigated = browser.devtools.network.onNavigated;
    if (onNavigated) {
      const handleNavigation = () => refreshOdooInfo();
      onNavigated.addListener(handleNavigation);
      onCleanup(() => onNavigated.removeListener(handleNavigation));
    }
  });

  return (
    <ToastProvider>
      <DevToolsContent />
      <ConfirmDialogHost />
      <Toaster
        positionY="top"
        positionX="right"
        offsetX={16}
        offsetY={16}
        gutter={8}
        duration={5000}
        showProgressBar
        pauseOnHover
        pauseOnWindowInactive={false}
        renderOnWindowInactive
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
  );
};
