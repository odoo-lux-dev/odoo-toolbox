import yaml from "@modyfi/vite-plugin-yaml";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, UserManifest, WxtViteConfig } from "wxt";

import pkg from "./package.json";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/auto-icons", "@wxt-dev/module-solid", "@wxt-dev/i18n/module"],
  srcDir: "src",
  outDir: "dist",
  entrypointsDir: "entries",
  manifest: ({ browser }) => {
    const manifest: Partial<UserManifest> = {
      name: pkg.displayName ?? pkg.name,
      // `package.json` version is a `{{EXTENSION_VERSION}}` placeholder replaced by
      // the release workflow before building. Fall back to a valid version locally.
      version: /^\d/.test(pkg.version) ? pkg.version : "0.0.0",
      default_locale: "en",
      permissions: [
        "storage",
        "tabs",
        "alarms",
        "scripting",
        "clipboardWrite",
        "webNavigation",
        "contextMenus",
      ],
      web_accessible_resources: [
        {
          matches: ["*://*/*"],
          resources: ["odoo-websites.js", "odoo-technical-list.js"],
        },
      ],
      commands: {
        _execute_action: {
          description: "Open the extension popup",
        },
        "toggle-debug": {
          description: "Toggle debug mode",
          suggested_key: {
            default: "Ctrl+Shift+D",
            mac: "Command+Shift+D",
          },
        },
      },
    };

    if (browser === "firefox") {
      manifest.browser_specific_settings = {
        gecko: {
          id: "odoo_toolbox@thcl-saju",
          data_collection_permissions: {
            required: ["none"],
          },
        },
      };

      const { _execute_action, ...restCommands } = manifest.commands!;
      manifest.commands = {
        ...restCommands,
        _execute_browser_action: {
          description: "Open the extension popup",
        },
      };

      manifest.permissions = [...manifest.permissions!, "<all_urls>"];
    }

    if (browser === "chrome") {
      manifest.host_permissions = ["*://*/*"];
    }

    return manifest;
  },
  hooks: {
    // Reverts the TypeScript config to WXT v0.20 defaults.
    // - https://wxt.dev/guide/resources/upgrading.html#wxttsconfigjson-compiler-option-changes
    "prepare:tsconfig": (_, { tsconfig }) => {
      const { compilerOptions } = tsconfig;
      delete compilerOptions.lib;
      compilerOptions.module = "ESNext";
      delete compilerOptions.moduleDetection;
      delete compilerOptions.allowImportingTsExtensions;
      delete compilerOptions.verbatimModuleSyntax;
      compilerOptions.esModuleInterop = true;
      compilerOptions.forceConsistentCasingInFileNames = true;
      compilerOptions.resolveJsonModule = true;
      delete compilerOptions.noFallthroughCasesInSwitch;
      delete compilerOptions.noUncheckedIndexedAccess;
      delete compilerOptions.noImplicitOverride;
    },
    "build:manifestGenerated": (wxt, manifest) => {
      if (wxt.config.mode === "development") {
        manifest.name += " (DEV)";
      }
    },
    "build:before": (wxt) => {
      if (wxt.config.mode === "development") {
        wxt.config.manifest.version = "0.0.1";
      }
    },
  },
  vite: ({ mode }) => {
    const build: Partial<WxtViteConfig["build"]> = {};
    if (mode === "development") {
      build.minify = false;
      build.commonjsOptions = {
        transformMixedEsModules: true,
      };
    } else {
      build.minify = "oxc";
      build.rolldownOptions = {
        output: {
          minify: {
            compress: true,
            mangle: false, // Keep variable names
          },
        },
      };
    }
    return {
      plugins: [tailwindcss(), yaml()],
      build,
      // Tailwind generates a sourcemap in build mode only when this is enabled,
      // otherwise Rolldown warns about a broken sourcemap during `wxt dev`.
      ...(mode === "development" ? { css: { devSourcemap: true } } : {}),
    };
  },
});
