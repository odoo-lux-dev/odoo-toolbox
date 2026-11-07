import { Show } from "solid-js";

import { isDynamicCondition } from "@/utils/field-utils";
import { t } from "@/utils/i18n-page";

import type { Modifier } from "../types";
import { TechnicalBadge } from "./technical-card";

const BADGES = {
  required: { label: () => t("technical_list.field_badge.required"), tone: "primary" },
  readonly: { label: () => t("technical_list.field_badge.readonly"), tone: "neutral" },
} as const;

/** Required/readonly badge, shown when the modifier may apply (`*` when conditional). */
export const FieldBadge = (props: {
  kind: keyof typeof BADGES;
  /** The modifier applies now or under a condition (see `FieldInfo.canBeRequired`). */
  possible: boolean;
  modifier: Modifier;
}) => {
  const badge = () => BADGES[props.kind];
  const isConditional = () => isDynamicCondition(props.modifier);

  return (
    <Show when={props.possible}>
      <TechnicalBadge
        tone={badge().tone}
        title={
          isConditional()
            ? t("technical_list.field_badge.conditional_when", [
                badge().label(),
                String(props.modifier),
              ])
            : undefined
        }
      >
        {badge().label()}
        {isConditional() ? "*" : ""}
      </TechnicalBadge>
    </Show>
  );
};
