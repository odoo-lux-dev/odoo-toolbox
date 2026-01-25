import { Notification } from "./notifications";
import { NotificationData } from "./notifications.types";

interface NotificationManagerProps {
    notifications: NotificationData[];
    closingNotifications: Set<string>;
    onClose: (id: string) => void;
    onAnimationComplete: (id: string) => void;
}

export const NotificationManager = ({
    notifications,
    closingNotifications,
    onClose,
    onAnimationComplete,
}: NotificationManagerProps) => {
    if (notifications.length === 0) {
        return null;
    }

    return (
        <div className="toast toast-top toast-end fixed top-4 right-4 z-9999 flex flex-col gap-2">
            {notifications.map((notification) => (
                <Notification
                    key={notification.id}
                    notification={notification}
                    onClose={onClose}
                    onAnimationComplete={onAnimationComplete}
                    isClosing={closingNotifications.has(notification.id)}
                />
            ))}
        </div>
    );
};
