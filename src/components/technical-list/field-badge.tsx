import { Badge } from "@/components/ui/badge";
import {
    isDebugTrue,
    isDynamicCondition,
    shouldUseCSSFallback,
} from "@/utils/field-utils";

interface FieldBadgeProps {
    debugValue: boolean | string | null | undefined;
    cssValue: boolean | undefined;
    hasDebugInfo: boolean;
    badgeType: "required" | "readonly";
}

const badgeLabelMap: Record<FieldBadgeProps["badgeType"], string> = {
    required: "Required",
    readonly: "Readonly",
};

const badgeColorMap: Record<FieldBadgeProps["badgeType"], "error" | "warning"> =
    {
        required: "error",
        readonly: "warning",
    };

export const FieldBadge = ({
    debugValue,
    cssValue,
    hasDebugInfo,
    badgeType,
}: FieldBadgeProps) => {
    if (isDynamicCondition(debugValue)) {
        return (
            <Badge
                size="sm"
                variant="outline"
                color={badgeColorMap[badgeType]}
                title={`${badgeLabelMap[badgeType]} when: ${debugValue}`}
                className="uppercase tracking-wide"
            >
                {badgeLabelMap[badgeType]}*
            </Badge>
        );
    }

    if (isDebugTrue(debugValue)) {
        return (
            <Badge
                size="sm"
                variant="outline"
                color={badgeColorMap[badgeType]}
                className="uppercase tracking-wide"
            >
                {badgeLabelMap[badgeType]}
            </Badge>
        );
    }

    if (cssValue && shouldUseCSSFallback(debugValue, hasDebugInfo)) {
        return (
            <Badge
                size="sm"
                variant="outline"
                color={badgeColorMap[badgeType]}
                className="uppercase tracking-wide"
            >
                {badgeLabelMap[badgeType]}
            </Badge>
        );
    }

    return null;
};
