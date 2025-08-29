import { useState } from "preact/hooks"
import { JSX } from "preact/jsx-runtime"
import {
    ActionButton,
    NotificationData,
    NotificationType,
} from "./notifications.types"

/**
 * Preact hook for managing an in-app notification queue and their closing state.
 *
 * The hook maintains an array of notifications and a set of notification IDs currently in the "closing" state.
 *
 * - showNotification(message, type = "info", duration = 5000, actionButton?)
 *   Enqueues a notification with a generated `id` (using Date.now().toString()). `message` may be a string or JSX element.
 * - removeNotification(id)
 *   Marks a notification as closing by adding its `id` to the closing set.
 * - handleAnimationComplete(id)
 *   Removes the notification and clears its id from the closing set (to be called after the closing animation finishes).
 *
 * @returns An object containing:
 *  - notifications: NotificationData[] — current notifications in the queue.
 *  - closingNotifications: Set<string> — IDs of notifications that are currently closing.
 *  - showNotification: (message, type?, duration?, actionButton?) => void — enqueue a new notification.
 *  - removeNotification: (id: string) => void — mark a notification as closing.
 *  - handleAnimationComplete: (id: string) => void — remove a notification after its closing animation.
 */
export function useNotifications() {
    const [notifications, setNotifications] = useState<NotificationData[]>([])
    const [closingNotifications, setClosingNotifications] = useState<
        Set<string>
    >(new Set())

    const showNotification = (
        message: string | JSX.Element,
        type: NotificationType = "info",
        duration = 5000,
        actionButton?: ActionButton
    ) => {
        const id = Date.now().toString()
        const notification: NotificationData = {
            id,
            message,
            type,
            duration,
            actionButton,
        }

        setNotifications((prev) => [...prev, notification])
    }

    const removeNotification = (id: string) => {
        setClosingNotifications((prev) => new Set([...prev, id]))
    }

    const handleAnimationComplete = (id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
        setClosingNotifications((prev) => {
            const newSet = new Set(prev)
            newSet.delete(id)
            return newSet
        })
    }

    return {
        notifications,
        closingNotifications,
        showNotification,
        removeNotification,
        handleAnimationComplete,
    }
}
