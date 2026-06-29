import type { JSX } from "solid-js";
import { showToast, dismissToast } from "solid-notifications";

export type NotificationType = "success" | "error" | "warning" | "info";

export interface ActionButton {
  label: string;
  variant?: string;
  icon?: string | JSX.Element;
  action: () => void;
  autoClose?: boolean;
}

export const ERROR_NOTIFICATION_TIMEOUT = 10000;

export function showNotification(
  message: string | JSX.Element,
  type: NotificationType = "info",
  duration = 5000,
  actionButton?: ActionButton,
) {
  const toastType = type as NotificationType | "default";

  if (actionButton) {
    let id: string;
    const result = showToast(
      <div>
        <div>{message}</div>
        <button
          class="btn mt-2 w-fit btn-outline btn-sm"
          onClick={() => {
            actionButton.action();
            if (actionButton.autoClose !== false) {
              dismissToast({ id });
            }
          }}
        >
          {actionButton.icon && <span>{actionButton.icon}</span>}
          {actionButton.label}
        </button>
      </div>,
      {
        type: toastType,
        duration: duration === 0 ? false : duration,
      },
    );
    id = result.id;
    return result;
  }

  return showToast(message, {
    type: toastType,
    duration: duration === 0 ? false : duration,
  });
}
