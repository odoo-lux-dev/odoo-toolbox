import type { JSX } from "solid-js";

import { Toggle } from "@/components/ui/toggle";
import { OptionItem } from "@/screens/options/components/option-item";
import { useSettingValue } from "@/screens/options/options-signals";
import type { StoredSettings } from "@/types";

interface ToggleOptionProps {
  id: string;
  title: string;
  tooltipContent?: JSX.Element;
  settingKey: keyof StoredSettings;
  onToggle: (checked: boolean) => void | Promise<void>;
}

export const ToggleOption = (props: ToggleOptionProps) => {
  const value = useSettingValue(props.settingKey);

  return (
    <OptionItem id={props.id} title={props.title} tooltipContent={props.tooltipContent}>
      <Toggle
        class="toggle-primary dark:toggle-accent"
        size="sm"
        checked={!!value()}
        onCheckedChange={props.onToggle}
      />
    </OptionItem>
  );
};
