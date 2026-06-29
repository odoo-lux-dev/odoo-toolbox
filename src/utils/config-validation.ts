interface ConfigFile {
  settings?: {
    enableDebugMode: string;
    enablePrintOptionsPDF: boolean;
    enablePrintOptionsHTML: boolean;
    showTechnicalModel: boolean;
    renameShProjectPage: boolean;
    extensionTheme: string;
    taskUrl: string;
    taskUrlRegex: string;
    nostalgiaMode: boolean;
    colorBlindMode: boolean;
    showLoginButtons: boolean;
  };
  favorites?: Array<{
    name: string;
    display_name: string;
    sequence: number;
    task_link: string;
  }>;
}

export type { ConfigFile };

export const validateConfigFile = (config: ConfigFile): { valid: boolean; message: string } => {
  if (!config.settings && !config.favorites) {
    return {
      valid: false,
      message: "File must contain at least 'settings' or 'favorites' properties.",
    };
  }

  if (config.settings) {
    if (typeof config.settings !== "object" || config.settings === null) {
      return {
        valid: false,
        message: "'settings' must be an object.",
      };
    }

    const requiredSettingsProps = [
      "enableDebugMode",
      "enablePrintOptionsPDF",
      "enablePrintOptionsHTML",
      "showTechnicalModel",
      "renameShProjectPage",
      "extensionTheme",
      "taskUrl",
      "taskUrlRegex",
      "nostalgiaMode",
      "colorBlindMode",
    ];

    const missingProps = requiredSettingsProps.filter(
      (prop) => !Object.hasOwn(config.settings!, prop),
    );

    if (missingProps.length > 0) {
      return {
        valid: false,
        message: `Settings missing required properties: ${missingProps.join(", ")}`,
      };
    }

    if (!["1", "disabled", "assets"].includes(config.settings.enableDebugMode)) {
      return {
        valid: false,
        message: "Invalid 'debugMode' value. Expected '1', 'disabled', or 'assets'.",
      };
    }

    const booleanProps = [
      "enablePrintOptionsHTML",
      "enablePrintOptionsPDF",
      "showTechnicalModel",
      "renameShProjectPage",
      "nostalgiaMode",
      "colorBlindMode",
    ] as const;

    for (const prop of booleanProps) {
      if (typeof config.settings[prop] !== "boolean") {
        return {
          valid: false,
          message: `Property '${prop}' must be a boolean.`,
        };
      }
    }

    if (!["dark", "light"].includes(config.settings.extensionTheme)) {
      return {
        valid: false,
        message: "Invalid 'extensionTheme' value. Expected 'dark' or 'light'.",
      };
    }

    if (typeof config.settings.taskUrl !== "string") {
      return {
        valid: false,
        message: "'taskUrl' must be a string.",
      };
    }

    if (typeof config.settings.taskUrlRegex !== "string") {
      return {
        valid: false,
        message: "'taskUrlRegex' must be a string.",
      };
    }
  }

  if (config.favorites) {
    if (!Array.isArray(config.favorites)) {
      return {
        valid: false,
        message: "'favorites' must be an array.",
      };
    }

    for (let i = 0; i < config.favorites.length; i++) {
      const favorite = config.favorites[i];

      if (typeof favorite !== "object" || favorite === null) {
        return {
          valid: false,
          message: `Favorite at index ${i} must be an object.`,
        };
      }

      const requiredFavoriteProps = ["name", "display_name", "sequence", "task_link"];

      const missingFavoriteProps = requiredFavoriteProps.filter(
        (prop) => !Object.hasOwn(favorite, prop),
      );

      if (missingFavoriteProps.length > 0) {
        return {
          valid: false,
          message: `Favorite at index ${i} is missing required properties: ${missingFavoriteProps.join(", ")}`,
        };
      }

      if (typeof favorite.name !== "string" || typeof favorite.display_name !== "string") {
        return {
          valid: false,
          message: `Favorite at index ${i}: 'name' and 'display_name' must be strings.`,
        };
      }

      if (typeof favorite.sequence !== "number") {
        return {
          valid: false,
          message: `Favorite at index ${i}: 'sequence' must be a number.`,
        };
      }

      if (typeof favorite.task_link !== "string") {
        return {
          valid: false,
          message: `Favorite at index ${i}: 'task_link' must be a string.`,
        };
      }
    }
  }

  return { valid: true, message: "" };
};
