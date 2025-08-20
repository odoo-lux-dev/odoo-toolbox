import preact from "@preact/preset-vite"
import { defineConfig, UserManifest, WxtViteConfig } from "wxt"
import pkg from "./package.json"

// See https://wxt.dev/api/config.html
export default defineConfig({
    modules: ["@wxt-dev/auto-icons"],
    srcDir: "src",
    outDir: "dist",
    entrypointsDir: "entries",
    manifest: ({ browser }) => {
        const manifest: Partial<UserManifest> = {
            name: pkg.displayName ?? pkg.name,
            permissions: [
                "storage",
                "tabs",
                "alarms",
                "scripting",
                "clipboardWrite",
            ],
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
            manifest.browser_specific_settings = {
                gecko: {
                    id: "odoo_toolbox@thcl-saju",
                },
            }

            const { _execute_action, ...restCommands } = manifest.commands!
            manifest.commands = {
                ...restCommands,
                _execute_browser_action: {
                    description: "Open the extension popup",
                },
            }

            manifest.permissions = [...manifest.permissions!, "<all_urls>"]
        }

        if (browser === "chrome") {
            manifest.host_permissions = ["*://*/*"]
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
    vite: ({ mode }) => {
        const build: Partial<WxtViteConfig["build"]> = {}
        if (mode === "development") {
            build.minify = false
            build.commonjsOptions = {
                transformMixedEsModules: true,
            }
        } else {
            build.minify = "esbuild"
        }
        return {
            plugins: [preact()],
            build,
            esbuild: {
                minifyIdentifiers: false, // Keep variable names
            },
        }
    },
})
