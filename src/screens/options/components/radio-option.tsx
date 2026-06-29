import { For, Show, type JSX } from "solid-js";

import { Radio } from "@/components/ui/radio";
import { OptionItem } from "@/screens/options/components/option-item";
import { useSettingValue } from "@/screens/options/options-signals";
import type { StoredSettings } from "@/types";

interface RadioChoice {
  value: string;
  label: string;
}

export interface RadioOptionProps {
  id: string;
  title: string;
  tooltipContent?: JSX.Element;
  additionalTooltipContent?: JSX.Element;
  settingKey: keyof StoredSettings;
  choices: RadioChoice[];
  defaultValue?: string;
  onChange: (value: string) => void | Promise<void>;
  children?: JSX.Element;
}

export const RadioOption = (props: RadioOptionProps) => {
  const value = useSettingValue(props.settingKey);
  const currentValue = () =>
    (value() as string) || props.defaultValue || props.choices[0]?.value || "";

  const handleChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    props.onChange(target.value);
  };

  const renderChoices = () => (
    <For each={props.choices}>
      {(choice) => (
        <Radio
          name={props.id}
          class="radio-primary dark:radio-accent"
          value={choice.value}
          checked={currentValue() === choice.value}
          onChange={handleChange}
          label={choice.label}
          size="sm"
        />
      )}
    </For>
  );

  return (
    <OptionItem
      id={props.id}
      title={props.title}
      tooltipContent={props.tooltipContent}
      additionalTooltipContent={props.additionalTooltipContent}
    >
      <Show
        when={props.children}
        fallback={
          <div id={props.id} class="flex flex-col gap-3">
            {renderChoices()}
          </div>
        }
      >
        <div id={props.id} class="flex flex-col gap-4">
          {props.children}
          <div class="flex flex-col gap-3">{renderChoices()}</div>
        </div>
      </Show>
    </OptionItem>
  );
};
