import { Show } from "solid-js";

import { Badge } from "@/components/ui/badge";
import { isDynamicCondition, isDebugTrue, shouldUseCSSFallback } from "@/utils/field-utils";
import { t } from "@/utils/i18n-page";

interface FieldBadgeProps {
  debugValue: boolean | string | null | undefined;
  cssValue: boolean | undefined;
  hasDebugInfo: boolean;
  badgeType: "required" | "readonly";
}

const getBadgeLabel = (badgeType: FieldBadgeProps["badgeType"]) =>
  badgeType === "required"
    ? t("technical_list.field_badge.required")
    : t("technical_list.field_badge.readonly");

const badgeColorMap: Record<FieldBadgeProps["badgeType"], "error" | "warning"> = {
  required: "error",
  readonly: "warning",
};

export const FieldBadge = (props: FieldBadgeProps) => (
  <Show
    when={isDynamicCondition(props.debugValue)}
    fallback={
      <Show
        when={isDebugTrue(props.debugValue)}
        fallback={
          <Show when={props.cssValue && shouldUseCSSFallback(props.debugValue, props.hasDebugInfo)}>
            <Badge
              size="sm"
              variant="outline"
              color={badgeColorMap[props.badgeType]}
              class="tracking-wide uppercase"
            >
              {getBadgeLabel(props.badgeType)}
            </Badge>
          </Show>
        }
      >
        <Badge
          size="sm"
          variant="outline"
          color={badgeColorMap[props.badgeType]}
          class="tracking-wide uppercase"
        >
          {getBadgeLabel(props.badgeType)}
        </Badge>
      </Show>
    }
  >
    <Badge
      size="sm"
      variant="outline"
      color={badgeColorMap[props.badgeType]}
      title={t("technical_list.field_badge.conditional_when", [
        getBadgeLabel(props.badgeType),
        String(props.debugValue),
      ])}
      class="tracking-wide uppercase"
    >
      {getBadgeLabel(props.badgeType)}*
    </Badge>
  </Show>
);
