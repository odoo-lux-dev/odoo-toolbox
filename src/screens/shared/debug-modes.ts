import {
  Bug01Icon,
  FileScriptIcon,
  TestTube01Icon,
  UnavailableIcon,
} from "@hugeicons/core-free-icons";

import {
  DebugModeAssetsIcon,
  DebugModeOffIcon,
  DebugModeOnIcon,
  DebugModeTestsAssetsIcon,
} from "@/components/shared/icons";
import { refreshActiveTabs } from "@/services/debug-mode-service";
import { settingsService } from "@/services/settings-service";
import type { DebugModeType } from "@/types";

/** Every debug mode with its labels and icons (options choices, popup tools and commands). */
export const DEBUG_MODES = [
  {
    value: "disabled",
    labelKey: "options.settings.debug_disabled",
    hintKey: "options.choices.debug_disabled_hint",
    icon: UnavailableIcon,
    toolIcon: DebugModeOffIcon,
  },
  {
    value: "1",
    labelKey: "options.settings.debug_always",
    icon: Bug01Icon,
    toolIcon: DebugModeOnIcon,
  },
  {
    value: "assets",
    labelKey: "options.settings.debug_assets",
    icon: FileScriptIcon,
    toolIcon: DebugModeAssetsIcon,
  },
  {
    value: "assets,tests",
    labelKey: "options.settings.debug_tests",
    icon: TestTube01Icon,
    toolIcon: DebugModeTestsAssetsIcon,
  },
] as const satisfies readonly {
  value: DebugModeType;
  labelKey: string;
  hintKey?: string;
  icon: unknown;
  toolIcon: unknown;
}[];

export const debugModeOf = (value: DebugModeType) =>
  DEBUG_MODES.find((mode) => mode.value === value) ?? DEBUG_MODES[0];

/** Stores the debug mode and reloads the active tab in it. */
export const applyDebugMode = async (mode: DebugModeType): Promise<void> => {
  await settingsService.set("enableDebugMode", mode);
  await refreshActiveTabs(mode);
};
