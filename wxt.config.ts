import { defineConfig, UserManifest } from "wxt"
import pkg from "./package.json"
import preact from "@preact/preset-vite"

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/auto-icons"],
  srcDir: "src",
  outDir: "dist",
  entrypointsDir: "entries",
  manifest: ({ browser }) => {
    const manifest: Partial<UserManifest> = {
      name: pkg.displayName ?? pkg.name,
      permissions: ["storage", "tabs", "alarms", "background"],
      web_accessible_resources: [
        {
          matches: ["*://*/*"],
          resources: ["odoo-websites.js"],
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
    }

    if (browser === "firefox") {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _execute_action, ...restManifestCommands } = manifest.commands

      manifest.browser_specific_settings = {
        gecko: {
          id: "odoo_toolbox@thcl-saju",
        },
      }
      manifest.commands = {
        ...restManifestCommands,
        _execute_browser_action: {
          description: "Open the extension popup",
        },
      }
    }

    return manifest
  },
  hooks: {
    "build:manifestGenerated": (wxt, manifest) => {
      if (wxt.config.mode === "development") {
        manifest.name += " (DEV)"
      }
    },
    "build:before": (wxt) => {
      if (wxt.config.mode === "development") {
        wxt.config.manifest.version = "0.0.1"
      }
    },
  },
  vite: () => {
    return {
      build: {
        minify: "esbuild",
      },
      esbuild: {
        minifyIdentifiers: false, // Keep variable names
      },
      plugins: [preact()],
    }
  },
})
