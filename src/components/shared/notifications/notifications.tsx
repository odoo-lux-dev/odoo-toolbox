import "./notifications.style.scss"
import { X } from "lucide-preact"
import { useEffect, useRef, useState } from "preact/hooks"
import { Logger } from "@/services/logger"
import { NotificationData } from "./notifications.types"

interface NotificationProps {
    notification: NotificationData
    onClose: (id: string) => void
    onAnimationComplete: (id: string) => void
    isClosing?: boolean
}

export const ERROR_NOTIFICATION_TIMEOUT = 10000

export const Notification = ({
    notification,
    onClose,
    onAnimationComplete,
    isClosing = false,
}: NotificationProps) => {
    const { id, message, type, duration = 5000, actionButton } = notification
    const [progress, setProgress] = useState(100)
    const [isPaused, setIsPaused] = useState(false)

    const startTimeRef = useRef<number>(0)
    const pausedTimeRef = useRef<number>(0)
    const pauseStartTimeRef = useRef<number | null>(null)

    const typeConfig = {
        success: {
            icon: "✅",
            label: "Success",
            className: "notification-success",
        },
        error: { icon: "❌", label: "Error", className: "notification-error" },
        warning: {
            icon: "⚠️",
            label: "Warning",
            className: "notification-warning",
        },
        info: { icon: "ℹ️", label: "Info", className: "notification-info" },
    }

    useEffect(() => {
        if (duration <= 0 || isClosing) return

        if (startTimeRef.current === 0) {
            startTimeRef.current = Date.now()
            pausedTimeRef.current = 0
            pauseStartTimeRef.current = null
        }

        const interval = setInterval(() => {
            if (isPaused) {
                if (pauseStartTimeRef.current === null) {
                    pauseStartTimeRef.current = Date.now()
                }
                return
            } else {
                if (pauseStartTimeRef.current !== null) {
                    pausedTimeRef.current +=
                        Date.now() - pauseStartTimeRef.current
                    pauseStartTimeRef.current = null
                }
            }

            const elapsed =
                Date.now() - startTimeRef.current - pausedTimeRef.current
            const remaining = Math.max(0, duration - elapsed)
            const progressPercent = (remaining / duration) * 100

            setProgress(progressPercent)

            if (remaining === 0) {
                clearInterval(interval)
                onClose(id)
            }
        }, 50)

        return () => clearInterval(interval)
    }, [duration, isClosing, onClose, id, isPaused])

    const handleMouseEnter = () => {
        setIsPaused(true)
    }

    const handleMouseLeave = () => {
        setIsPaused(false)
    }

    const handleClose = () => {
        onClose(id)
    }

    const handleActionButtonClick = () => {
        if (!actionButton) return

        try {
            actionButton.action()
            if (actionButton.autoClose !== false) {
                onClose(id)
            }
        } catch (error) {
            Logger.error("Error executing notification action:", error)
        }
    }

    const handleAnimationEnd = (e: AnimationEvent) => {
        if (e.animationName === "bounceOutRight") {
            onAnimationComplete(id)
        }
    }

    return (
        <div
            className={`notification ${typeConfig[type].className} ${isClosing ? "slide-out" : ""}`}
            onAnimationEnd={handleAnimationEnd}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="notification-header">
                <div className="notification-type">
                    <span className="notification-icon">
                        {typeConfig[type].icon}
                    </span>
                    <span className="notification-label">
                        {typeConfig[type].label}
                    </span>
                </div>
                <button
                    className="notification-close"
                    onClick={handleClose}
                    type="button"
                >
                    <X size={16} />
                </button>
            </div>
            <div className="notification-body">
                <div className="notification-message">{message}</div>
                {actionButton && (
                    <div className="notification-actions">
                        <button
                            className={`notification-action-button ${actionButton.variant || "primary"}`}
                            onClick={handleActionButtonClick}
                            type="button"
                        >
                            {actionButton.icon && (
                                <span className="notification-action-icon">
                                    {actionButton.icon}
                                </span>
                            )}
                            <span className="notification-action-label">
                                {actionButton.label}
                            </span>
                        </button>
                    </div>
                )}
            </div>
            {duration > 0 && !isClosing && (
                <div className="notification-progress">
                    <div
                        className="notification-progress-bar"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}
        </div>
    )
}
