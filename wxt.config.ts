import tailwindcss from "@tailwindcss/vite";
import { defineConfig, UserManifest, WxtViteConfig } from "wxt";

import pkg from "./package.json";

/** Font subsets kept in the build: those of the extension's own locales. */
const FONT_SUBSETS = new Set(["latin", "latin-ext"]);
const FONT_SUBSET =
  /-(latin-ext|latin|cyrillic-ext|cyrillic|greek-ext|greek|vietnamese|hebrew)-(?:wght|\d)/;

/**
 * Trims the fontsource `@font-face` rules of the emitted CSS, then drops the font files
 * no rule references any more. Tailwind inlines the fontsource imports itself, so the
 * rules can only be filtered once the CSS is built.
 * - The `.woff` fallbacks: Chrome and Firefox always pick the `.woff2` file.
 * - The non-Latin subsets: no locale needs them, and `unicode-range` lets those
 *   characters fall back to a system font.
 */
const trimFonts = {
  name: "trim-fonts",
  generateBundle(
    _options: unknown,
    bundle: Record<string, { type: string; fileName: string; source?: unknown }>,
  ) {
    const usedFonts = new Set<string>();
    for (const output of Object.values(bundle)) {
      if (output.type !== "asset" || !output.fileName.endsWith(".css")) continue;
      const css = String(output.source)
        .replace(/,\s*url\([^)]*\.woff\)\s*format\(["']?woff["']?\)/g, "")
        .replace(/@font-face\{[^}]*\}/g, (rule) => {
          const subset = rule.match(FONT_SUBSET)?.[1];
          return !subset || FONT_SUBSETS.has(subset) ? rule : "";
        });
      output.source = css;
      for (const [, fileName] of css.matchAll(/url\(\/?([^)"']+\.woff2?)\)/g))
        usedFonts.add(fileName);
    }
    for (const fileName of Object.keys(bundle)) {
      if (/\.woff2?$/.test(fileName) && !usedFonts.has(fileName)) delete bundle[fileName];
    }
  },
};

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
        "declarativeNetRequestWithHostAccess",
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
        "toggle-technical-list": {
          description: "Open or close the technical sidebar",
          suggested_key: {
            default: "Ctrl+Shift+L",
            mac: "Command+Shift+L",
          },
        },
        "toggle-technical-list-selection": {
          description: "Select an element in the technical sidebar",
          suggested_key: {
            default: "Ctrl+Shift+F",
            mac: "Command+Shift+F",
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
    // Keeps the lazy CodeMirror chunk of the DevTools panel under the 500 kB warning. Only
    // on the extension pages build: the scripts built as IIFE cannot be code-split.
    "vite:build:extendConfig": (entrypoints, viteConfig) => {
      if (!entrypoints.some((entrypoint) => entrypoint.name === "devtools-panel")) return;
      viteConfig.build ??= {};
      viteConfig.build.rolldownOptions ??= {};
      const options = viteConfig.build.rolldownOptions;
      if (Array.isArray(options.output)) return;
      options.output = {
        ...options.output,
        codeSplitting: { groups: [{ name: "lezer", test: /node_modules[\\/]@lezer[\\/]/ }] },
      };
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
      plugins: [tailwindcss(), trimFonts],
      build,
      // Tailwind generates a sourcemap in build mode only when this is enabled,
      // otherwise Rolldown warns about a broken sourcemap during `wxt dev`.
      ...(mode === "development" ? { css: { devSourcemap: true } } : {}),
    };
  },
});
