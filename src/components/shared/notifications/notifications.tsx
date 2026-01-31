import "./notifications.style.css";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Alert01Icon,
    Cancel01Icon,
    CheckmarkCircle01Icon,
    InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import { useEffect, useRef, useState } from "preact/hooks";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Logger } from "@/services/logger";
import { NotificationData } from "./notifications.types";

interface NotificationProps {
    notification: NotificationData;
    onClose: (id: string) => void;
    onAnimationComplete: (id: string) => void;
    isClosing?: boolean;
}

export const ERROR_NOTIFICATION_TIMEOUT = 10000;

export const Notification = ({
    notification,
    onClose,
    onAnimationComplete,
    isClosing = false,
}: NotificationProps) => {
    const { id, message, type, duration = 5000, actionButton } = notification;
    const [progress, setProgress] = useState(100);
    const [isPaused, setIsPaused] = useState(false);

    const startTimeRef = useRef<number>(0);
    const pausedTimeRef = useRef<number>(0);
    const pauseStartTimeRef = useRef<number | null>(null);

    const typeConfig = {
        success: {
            icon: (
                <HugeiconsIcon
                    icon={CheckmarkCircle01Icon}
                    size={16}
                    color="currentColor"
                    strokeWidth={1.6}
                />
            ),
            label: "Success",
            className: "alert-success",
            borderLeftColor: "var(--color-success)",
        },
        error: {
            icon: (
                <HugeiconsIcon
                    icon={Alert01Icon}
                    size={16}
                    color="currentColor"
                    strokeWidth={1.6}
                />
            ),
            label: "Error",
            className: "alert-error",
            borderLeftColor: "var(--color-error)",
        },
        warning: {
            icon: (
                <HugeiconsIcon
                    icon={Alert01Icon}
                    size={16}
                    color="currentColor"
                    strokeWidth={1.6}
                />
            ),
            label: "Warning",
            className: "alert-warning",
            borderLeftColor: "var(--color-warning)",
        },
        info: {
            icon: (
                <HugeiconsIcon
                    icon={InformationCircleIcon}
                    size={16}
                    color="currentColor"
                    strokeWidth={1.6}
                />
            ),
            label: "Info",
            className: "alert-info",
            borderLeftColor: "var(--color-info)",
        },
    };

    useEffect(() => {
        if (duration <= 0 || isClosing) return;

        if (startTimeRef.current === 0) {
            startTimeRef.current = Date.now();
            pausedTimeRef.current = 0;
            pauseStartTimeRef.current = null;
        }

        const interval = setInterval(() => {
            if (isPaused) {
                if (pauseStartTimeRef.current === null) {
                    pauseStartTimeRef.current = Date.now();
                }
                return;
            } else {
                if (pauseStartTimeRef.current !== null) {
                    pausedTimeRef.current +=
                        Date.now() - pauseStartTimeRef.current;
                    pauseStartTimeRef.current = null;
                }
            }

            const elapsed =
                Date.now() - startTimeRef.current - pausedTimeRef.current;
            const remaining = Math.max(0, duration - elapsed);
            const progressPercent = (remaining / duration) * 100;

            setProgress(progressPercent);

            if (remaining === 0) {
                clearInterval(interval);
                onClose(id);
            }
        }, 50);

        return () => clearInterval(interval);
    }, [duration, isClosing, onClose, id, isPaused]);

    const handleMouseEnter = () => {
        setIsPaused(true);
    };

    const handleMouseLeave = () => {
        setIsPaused(false);
    };

    const handleClose = () => {
        onClose(id);
    };

    const handleActionButtonClick = () => {
        if (!actionButton) return;

        try {
            actionButton.action();
            if (actionButton.autoClose !== false) {
                onClose(id);
            }
        } catch (error) {
            Logger.error("Error executing notification action:", error);
        }
    };

    const handleAnimationEnd = (e: AnimationEvent) => {
        if (e.animationName === "bounceOutRight") {
            onAnimationComplete(id);
        }
    };

    const actionVariantKey = actionButton?.variant || "primary";
    const actionVariantStyle = actionVariantKey.includes("outline")
        ? "outline"
        : "solid";
    const actionColor = actionVariantKey
        .replace("-outline", "")
        .replace("danger", "error") as
        | "primary"
        | "secondary"
        | "success"
        | "warning"
        | "error";

    return (
        <div
            className={`notification alert ${typeConfig[type].className} ${isClosing ? "slide-out" : ""} flex flex-col gap-0 border border-l-4 border-base-200 bg-base-100 p-0 whitespace-pre-wrap shadow-lg`}
            style={{ borderLeftColor: typeConfig[type].borderLeftColor }}
            onAnimationEnd={handleAnimationEnd}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            role="alert"
        >
            <div className="notification-header flex w-full items-center justify-between px-4 pt-3 pb-2">
                <div className="notification-type flex items-center gap-2">
                    <span
                        className="notification-icon text-base leading-none"
                        style={{ color: typeConfig[type].borderLeftColor }}
                    >
                        {typeConfig[type].icon}
                    </span>
                    <span className="notification-label text-xs font-semibold tracking-wide text-base-content uppercase">
                        {typeConfig[type].label}
                    </span>
                </div>
                <IconButton
                    className="notification-close text-base-content/60 hover:bg-base-200/60 hover:text-primary"
                    onClick={handleClose}
                    type="button"
                    label="Close"
                    variant="ghost"
                    size="sm"
                    square
                    icon={
                        <HugeiconsIcon
                            icon={Cancel01Icon}
                            size={16}
                            color="currentColor"
                            strokeWidth={1.6}
                        />
                    }
                />
            </div>
            <div className="notification-body px-4 pt-2 pb-3">
                <div className="notification-message text-sm/relaxed text-base-content">
                    {message}
                </div>
                {actionButton && (
                    <div className="notification-actions mt-3 flex items-center gap-2">
                        <Button
                            className={`notification-action-button inline-flex items-center gap-1 normal-case ${actionButton.variant || "primary"}`}
                            onClick={handleActionButtonClick}
                            type="button"
                            size="sm"
                            variant={actionVariantStyle}
                            color={actionColor}
                        >
                            {actionButton.icon && (
                                <span className="notification-action-icon text-sm leading-none">
                                    {actionButton.icon}
                                </span>
                            )}
                            <span className="notification-action-label leading-none">
                                {actionButton.label}
                            </span>
                        </Button>
                    </div>
                )}
            </div>
            {duration > 0 && !isClosing && (
                <div className="notification-progress h-1 w-full overflow-hidden bg-base-200">
                    <div
                        className="notification-progress-bar h-full transition-[width] duration-150"
                        style={{
                            width: `${progress}%`,
                            backgroundColor: typeConfig[type].borderLeftColor,
                        }}
                    />
                </div>
            )}
        </div>
    );
};
