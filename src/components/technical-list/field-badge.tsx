import {
    isDebugTrue,
    isDynamicCondition,
    shouldUseCSSFallback,
} from "@/utils/field-utils"

interface FieldBadgeProps {
    debugValue: boolean | string | null | undefined
    cssValue: boolean | undefined
    hasDebugInfo: boolean
    badgeType: "required" | "readonly"
}

export const FieldBadge = ({
    debugValue,
    cssValue,
    hasDebugInfo,
    badgeType,
}: FieldBadgeProps) => {
    if (isDynamicCondition(debugValue)) {
        return (
            <span
                className={`x-odoo-technical-list-info-debug-badge x-odoo-badge-${badgeType}`}
                title={`${badgeType.charAt(0).toUpperCase() + badgeType.slice(1)} when: ${debugValue}`}
            >
                {badgeType.charAt(0).toUpperCase() + badgeType.slice(1)}*
            </span>
        )
    } else if (isDebugTrue(debugValue)) {
        return (
            <span
                className={`x-odoo-technical-list-info-debug-badge x-odoo-badge-${badgeType}`}
            >
                {badgeType.charAt(0).toUpperCase() + badgeType.slice(1)}
            </span>
        )
    } else if (cssValue && shouldUseCSSFallback(debugValue, hasDebugInfo)) {
        return (
            <span
                className={`x-odoo-technical-list-info-debug-badge x-odoo-badge-${badgeType}`}
            >
                {badgeType.charAt(0).toUpperCase() + badgeType.slice(1)}
            </span>
        )
    }
    return null
}
