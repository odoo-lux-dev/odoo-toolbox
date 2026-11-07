import { createRoot, createSignal, type Accessor } from "solid-js";

import { Logger } from "@/services/logger";
import { settingsService } from "@/services/settings-service";
import type { StoredSettings } from "@/types";
import { getDefaultSettings } from "@/utils/settings-schema";

let store: Accessor<StoredSettings> | undefined;

/**
 * Stored settings of the extension page, kept in sync with the storage. Starts
 * with the defaults, so readers never handle a missing value. One store per page,
 * created on first use and alive as long as the page.
 */
export const useSettings = (): Accessor<StoredSettings> => {
  store ??= createRoot(() => {
    const [settings, setSettings] = createSignal(getDefaultSettings());
    settingsService
      .getSettings()
      .then(setSettings)
      .catch((error) => Logger.error("Failed to load the settings:", error));
    settingsService.watchSettings(setSettings);
    return settings;
  });
  return store;
};
