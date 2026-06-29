import { createMemo, createSignal, onMount } from "solid-js";

import { Logger } from "@/services/logger";
import { settingsService } from "@/services/settings-service";

export const useThemedIcons = () => {
  const [isNostalgia, setIsNostalgia] = createSignal(false);

  onMount(async () => {
    try {
      const nostalgiaMode = await settingsService.getNostalgiaMode();
      setIsNostalgia(!!nostalgiaMode);
    } catch (error) {
      Logger.error("Error loading nostalgia mode:", error);
    }
  });

  const themeProps = createMemo(() => ({
    moonProps: {
      fill: isNostalgia() ? "#fdf49a" : "none",
    },
    sunProps: {
      stroke: isNostalgia() ? "#FCEA2B" : "currentColor",
    },
  }));

  return {
    isNostalgia,
    themeProps,
  };
};
