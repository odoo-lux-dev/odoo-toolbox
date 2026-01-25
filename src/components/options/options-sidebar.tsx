import { HugeiconsIcon } from "@hugeicons/react";
import {
    Download04Icon,
    GithubIcon,
    Settings02Icon,
    StarIcon,
    Upload04Icon,
} from "@hugeicons/core-free-icons";
import { createRef } from "preact";
import { ChangeEvent } from "preact/compat";
import { useState } from "preact/hooks";
import { Link } from "preact-router";
import Match from "preact-router/match";
import { ThemeController } from "@/components/ui/theme-controller";
import { LuxembourgFlag } from "@/components/shared/icons/luxembourg-flag";
import {
    handleExportConfig,
    handleImportConfig,
} from "@/entries/options/backup";

export const OptionsSidebar = () => {
    const [statusMessage, setStatusMessage] = useState("");
    const [statusClass, setStatusClass] = useState("");
    const [extensionVersion] = useState(
        `v${browser.runtime.getManifest().version}`,
    );

    const fileInputRef = createRef();

    const handleExport = async () => {
        setStatusMessage("Exporting your settings...");
        setStatusClass("text-xs text-info");
        try {
            await handleExportConfig();
            setStatusMessage("");
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error ? error.message : String(error);
            setStatusMessage(
                `An error occurred during export: ${errorMessage || "Unknown error"}`,
            );
            setStatusClass("text-xs text-error");
        }
    };

    const handleImport = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
        await handleImportConfig(event);
        (event.target as HTMLInputElement).value = "";
    };

    return (
        <div class="w-72 bg-base-100 min-h-screen flex flex-col p-4 gap-6">
            <div class="relative flex items-center justify-center">
                <h1 class="text-xl font-semibold text-center text-primary dark:text-accent">
                    Odoo Toolbox
                </h1>
                <div class="absolute right-0">
                    <ThemeController iconSize={18} />
                </div>
            </div>
            <div class="flex flex-col gap-2">
                <Match path="/">
                    {({ path }: { path: string }) => (
                        <details
                            class="collapse collapse-arrow bg-base-100"
                            open={path === "/options"}
                        >
                            <summary class="collapse-title p-0">
                                <Link
                                    id="global-options"
                                    className={`btn btn-ghost justify-start w-full ${path === "/options" ? "btn-active" : ""}`}
                                    href="#/options"
                                >
                                    <HugeiconsIcon
                                        icon={Settings02Icon}
                                        size={18}
                                        color="#2ebcfa"
                                        strokeWidth={2}
                                    />
                                    Options
                                </Link>
                            </summary>
                            <div class="collapse-content flex flex-col gap-1 pl-8 pt-1">
                                <Link
                                    className="btn btn-ghost btn-sm justify-start"
                                    href="#/options#odoo-options"
                                >
                                    Odoo
                                </Link>
                                <Link
                                    className="btn btn-ghost btn-sm justify-start"
                                    href="#/options#odoosh-options"
                                >
                                    Odoo.SH
                                </Link>
                            </div>
                        </details>
                    )}
                </Match>
                <Match path="/">
                    {({ path }: { path: string }) => (
                        <Link
                            id="sh-favorites"
                            className={`btn btn-ghost justify-start ${path === "/favorites" ? "btn-active" : ""}`}
                            href="#/favorites"
                        >
                            <HugeiconsIcon
                                icon={StarIcon}
                                size={18}
                                color="#ED8A19"
                                strokeWidth={2}
                            />
                            SH Favorites
                        </Link>
                    )}
                </Match>
            </div>
            <div class="mt-auto flex flex-col gap-4 items-center">
                <div id="x-odoo-backup-options-status" class={statusClass}>
                    {statusMessage}
                </div>

                <div class="flex gap-2">
                    <button
                        class="btn btn-sm btn-outline btn-primary gap-2"
                        onClick={handleExport}
                    >
                        <HugeiconsIcon
                            icon={Download04Icon}
                            size={15}
                            color="currentColor"
                            strokeWidth={2}
                        />
                        Export
                    </button>
                    <button
                        class="btn btn-sm btn-outline btn-primary gap-2"
                        onClick={handleImport}
                    >
                        <HugeiconsIcon
                            icon={Upload04Icon}
                            size={15}
                            color="currentColor"
                            strokeWidth={2}
                        />
                        Restore
                    </button>
                    <input
                        type="file"
                        accept=".json"
                        class="hidden"
                        ref={fileInputRef}
                        onInput={handleFileChange}
                    />
                </div>
                <div class="flex items-center gap-2 text-xs">
                    <a
                        href="https://github.com/odoo-lux-dev/odoo-toolbox"
                        target="_blank"
                        rel="noopener noreferrer"
                        title="GitHub Repository"
                    >
                        <HugeiconsIcon
                            icon={GithubIcon}
                            size={16}
                            color="currentColor"
                            strokeWidth={2}
                        />
                    </a>
                    <span id="extension-version">{extensionVersion}</span>
                    <LuxembourgFlag />
                </div>
            </div>
        </div>
    );
};
