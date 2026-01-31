import { JSX } from "preact";
import { useEffect } from "preact/hooks";
import { useNotifications } from "@/components/shared/notifications/notifications.hook";
import { NotificationManager } from "@/components/shared/notifications/notifications-manager";
import { Logger } from "@/services/logger";
import { odooRpcService } from "@/services/odoo-rpc-service";
import { DevToolsContextValue } from "@/types";
import { getCurrentPageAndProcess } from "@/utils/current-page-utils";
import { DevToolsContext } from "./devtools-context";
import {
    databaseSignal,
    executeQuery,
    hasHostPermission,
    isSupportedSignal,
    odooVersionSignal,
    setRpcQuery,
} from "./devtools-signals";

interface DevToolsProviderProps {
    children: JSX.Element | JSX.Element[];
}

export const DevToolsProvider = ({ children }: DevToolsProviderProps) => {
    const {
        notifications,
        closingNotifications,
        showNotification,
        removeNotification,
        handleAnimationComplete,
    } = useNotifications();

    useEffect(() => {
        const refreshOdooInfo = async () => {
            try {
                hasHostPermission.value =
                    await odooRpcService.checkHostPermission();

                if (!hasHostPermission.value) {
                    return;
                }

                const [supported, odooInfo] = await Promise.all([
                    odooRpcService.isOdooVersionSupported(),
                    odooRpcService.getRpcOdooInfo(),
                ]);

                const version = odooInfo.version
                    ? String(odooInfo.version)
                    : null;

                if (version) {
                    odooVersionSignal.value = version;
                }
                isSupportedSignal.value = supported;

                if (odooInfo.database) {
                    databaseSignal.value = odooInfo.database;
                } else {
                    databaseSignal.value = undefined;
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
                                Logger.warn(
                                    "Failed to auto-execute query on initialization:",
                                    queryError,
                                );
                            }
                        }
                    } catch (pageError) {
                        Logger.warn(
                            "Failed to get current page info on initialization:",
                            pageError,
                        );
                    }
                }
            } catch (error) {
                Logger.warn("Failed to initialize DevTools:", error);
                isSupportedSignal.value = false;
                databaseSignal.value = undefined;
            }
        };

        const initializeDevTools = async () => {
            await refreshOdooInfo();

            if (browser.devtools.network.onNavigated) {
                const handleNavigation = async (_url: string) => {
                    await refreshOdooInfo();
                };

                browser.devtools.network.onNavigated.addListener(
                    handleNavigation,
                );

                return () => {
                    browser.devtools.network.onNavigated.removeListener(
                        handleNavigation,
                    );
                };
            }
        };

        initializeDevTools();
    }, []);

    const setOdooVersion = (version: string | null) => {
        odooVersionSignal.value = version;
    };

    const contextValue: DevToolsContextValue = {
        showNotification,

        isSupported: isSupportedSignal.value,
        odooVersion: odooVersionSignal.value,
        setOdooVersion,
    };

    return (
        <DevToolsContext.Provider value={contextValue}>
            {children}
            <NotificationManager
                notifications={notifications}
                closingNotifications={closingNotifications}
                onClose={removeNotification}
                onAnimationComplete={handleAnimationComplete}
            />
        </DevToolsContext.Provider>
    );
};
