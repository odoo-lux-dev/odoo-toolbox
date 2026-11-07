export const DEBUG_MODE_TYPES = ["disabled", "1", "assets", "assets,tests"] as const;
export type DebugModeType = (typeof DEBUG_MODE_TYPES)[number];

export const DEFAULT_COLOR_SCHEMES = ["none", "system", "light", "dark"] as const;
export type DefaultColorScheme = (typeof DEFAULT_COLOR_SCHEMES)[number];

export const TECHNICAL_LIST_POSITIONS = ["right", "left"] as const;
export type TechnicalListPosition = (typeof TECHNICAL_LIST_POSITIONS)[number];

export type IgnoredDebugPath =
  | { scope: "domain"; domain: string; deletable: boolean }
  | { scope: "path"; path: string; deletable: boolean }
  | { scope: "domain_path"; domain: string; path: string; deletable: boolean };

export type DebugPathIgnoreScope = IgnoredDebugPath["scope"];

export type { BooleanSettingKey, SettingKey, StoredSettings } from "@/utils/settings-schema";
