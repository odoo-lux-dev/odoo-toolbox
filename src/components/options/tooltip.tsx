import { CircleQuestionMark } from "lucide-preact"
import { ComponentChildren } from "preact"
import { CSSProperties } from "preact/compat"
import { useEffect, useRef, useState } from "preact/hooks"

interface TooltipProps {
    content: ComponentChildren
    additionalContent?: ComponentChildren
    maxWidth?: string
    className?: string
    icon?: ComponentChildren
}

export const Tooltip = ({
    content,
    additionalContent,
    maxWidth,
    className = "",
    icon,
}: TooltipProps) => {
    const tooltipRef = useRef<HTMLDivElement>(null)
    const messageRef = useRef<HTMLDivElement>(null)
    const [tooltipStyle, setTooltipStyle] = useState<CSSProperties>({})

    useEffect(() => {
        if (!tooltipRef.current) return

        const handleMouseEnter = () => {
            if (!messageRef.current) return

            setTimeout(() => {
                const message = messageRef.current
                if (!message) return

                const rect = message.getBoundingClientRect()

                if (rect.right > window.innerWidth) {
                    setTooltipStyle({
                        visibility: "visible",
                        left: "auto",
                        right: "20px",
                    })
                } else {
                    setTooltipStyle({
                        visibility: "visible",
                    })
                }
            }, 0)
        }

        const handleMouseLeave = () => {
            setTooltipStyle({})
        }

        const tooltipElement = tooltipRef.current
        tooltipElement.addEventListener("mouseenter", handleMouseEnter)
        tooltipElement.addEventListener("mouseleave", handleMouseLeave)

        return () => {
            tooltipElement.removeEventListener("mouseenter", handleMouseEnter)
            tooltipElement.removeEventListener("mouseleave", handleMouseLeave)
        }
    }, [])

    return (
        <div
            ref={tooltipRef}
            className={`x-odoo-options-page-tooltip ${className}`}
        >
            <div
                ref={messageRef}
                className="x-odoo-options-page-tooltip-message"
                style={{
                    maxWidth: maxWidth || undefined,
                    ...tooltipStyle,
                }}
            >
                <span>
                    <i>{content}</i>
                </span>
                {additionalContent ? additionalContent : null}
            </div>
            {icon || <CircleQuestionMark size={14} color="#02c7b5" />}
        </div>
    )
}
