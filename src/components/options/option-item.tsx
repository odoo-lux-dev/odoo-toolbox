import { ComponentChildren } from "preact"
import { Tooltip } from "./tooltip"

interface OptionItemProps {
    id: string
    title: string
    description?: string
    tooltipContent?: ComponentChildren
    additionalTooltipContent?: ComponentChildren
    children: ComponentChildren
    className?: string
}

export const OptionItem = ({
    id,
    title,
    description,
    tooltipContent,
    additionalTooltipContent,
    children,
    className = "",
}: OptionItemProps) => {
    return (
        <div id={id} className={`x-odoo-options-page-option-item ${className}`}>
            <h3>
                {title}
                {tooltipContent && (
                    <Tooltip
                        content={tooltipContent}
                        additionalContent={additionalTooltipContent}
                    />
                )}
            </h3>
            {description && <p>{description}</p>}
            <div className="x-odoo-options-page-option-content">{children}</div>
        </div>
    )
}
