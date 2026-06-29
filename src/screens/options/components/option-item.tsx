import { Show, type JSX } from "solid-js";

import { Card } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/tooltip";

interface OptionItemProps {
  id: string;
  title: string;
  description?: string;
  tooltipContent?: JSX.Element;
  additionalTooltipContent?: JSX.Element;
  children: JSX.Element;
  class?: string;
}

export const OptionItem = (props: OptionItemProps) => {
  return (
    <Card
      id={props.id}
      class={`break-inside-avoid self-start bg-base-100 shadow-sm ${props.class ?? ""}`}
      bodyClass="gap-2"
    >
      <div class="flex items-start justify-between gap-2">
        <h3 class="card-title text-base">{props.title}</h3>
        <Show when={props.tooltipContent}>
          <InfoTooltip
            content={props.tooltipContent ?? ""}
            additionalContent={props.additionalTooltipContent}
            placement="left"
          />
        </Show>
      </div>
      <Show when={props.description}>
        <p class="text-sm opacity-80">{props.description}</p>
      </Show>
      <div class="mt-2 flex flex-col gap-2">{props.children}</div>
    </Card>
  );
};
