import { useState } from "preact/hooks"
import { JSX } from "preact/jsx-runtime"
import {
    ActionButton,
    NotificationData,
    NotificationType,
} from "./notifications.types"

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
