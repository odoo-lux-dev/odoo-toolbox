import { useDevToolsContext } from "@/contexts/devtools-context";
import { Logger } from "@/services/logger";

export const useDevToolsNotifications = () => {
    const { showNotification } = useDevToolsContext();

    return {
        showNotification:
            showNotification ||
            (() => {
                Logger.warn("Notifications not available in this context");
            }),
        isNotificationsAvailable: !!showNotification,
    };
};
