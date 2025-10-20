import { JSX } from "preact/jsx-runtime";

export type NotificationType = "success" | "error" | "warning" | "info";

export interface ActionButton {
    label: string;
    variant?:
        | "primary"
        | "primary-outline"
        | "secondary"
        | "secondary-outline"
        | "success"
        | "success-outline"
        | "warning"
        | "warning-outline"
        | "danger"
        | "danger-outline";
    icon?: string | JSX.Element;
    action: () => void;
    autoClose?: boolean;
}

export interface NotificationData {
    id: string;
    message: string | JSX.Element;
    type: NotificationType;
    duration?: number;
    actionButton?: ActionButton;
}
