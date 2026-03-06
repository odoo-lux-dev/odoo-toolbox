import { HugeiconsIcon } from "@hugeicons/react";
import {
    ArrowUpRight01Icon,
    Bug01Icon,
    Download04Icon,
    GithubIcon,
    Idea01Icon,
    Settings02Icon,
    StarIcon,
    Upload04Icon,
    Book02Icon,
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
        <div class="flex min-h-screen w-72 flex-col gap-6 bg-base-100 p-4">
            <div class="relative flex items-center justify-center">
                <h1 class="text-center text-xl font-semibold text-primary dark:text-accent">
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
                            class="collapse-arrow collapse bg-base-100"
                            open={path === "/options"}
                        >
                            <summary class="collapse-title p-0">
                                <Link
                                    id="global-options"
                                    className={`btn w-full justify-start btn-ghost ${path === "/options" ? "btn-active" : ""}`}
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
                            <div class="collapse-content flex flex-col gap-1 pt-1 pl-8">
                                <Link
                                    className="btn justify-start btn-ghost btn-sm"
                                    href="#/options#odoo-options"
                                >
                                    Odoo
                                </Link>
                                <Link
                                    className="btn justify-start btn-ghost btn-sm"
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
                            className={`btn justify-start btn-ghost ${path === "/favorites" ? "btn-active" : ""}`}
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
            <div class="mt-auto flex flex-col items-center gap-4">
                <div id="x-odoo-backup-options-status" class={statusClass}>
                    {statusMessage}
                </div>

                <div class="flex w-full gap-1">
                    <button
                        class="btn btn-ghost btn-sm flex-1 gap-2 border border-base-content/15"
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
                        class="btn btn-ghost btn-sm flex-1 gap-2 border border-base-content/15"
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
                <div class="flex w-full flex-col">
                    <a
                        href="https://odoo-lux-dev.github.io/odoo-toolbox/"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="group flex items-center justify-between rounded-sm p-2 text-sm text-base-content/60 hover:bg-base-200 hover:text-base-content"
                    >
                        <div class="flex items-center gap-2">
                            <HugeiconsIcon
                                icon={Book02Icon}
                                size={16}
                                color="currentColor"
                                strokeWidth={2}
                            />
                            <span>Documentation</span>
                        </div>
                        <span class="transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                            <HugeiconsIcon
                                icon={ArrowUpRight01Icon}
                                size={14}
                                color="currentColor"
                                strokeWidth={2}
                            />
                        </span>
                    </a>
                    <a
                        href="https://github.com/odoo-lux-dev/odoo-toolbox/issues/new?template=bug_report.yml"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="group flex items-center justify-between rounded-sm p-2 text-sm text-base-content/60 hover:bg-base-200 hover:text-base-content"
                    >
                        <div class="flex items-center gap-2">
                            <HugeiconsIcon
                                icon={Bug01Icon}
                                size={16}
                                color="currentColor"
                                strokeWidth={2}
                            />
                            <span>Report a bug</span>
                        </div>
                        <span class="transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                            <HugeiconsIcon
                                icon={ArrowUpRight01Icon}
                                size={14}
                                color="currentColor"
                                strokeWidth={2}
                            />
                        </span>
                    </a>
                    <a
                        href="https://github.com/odoo-lux-dev/odoo-toolbox/issues/new?template=feature_request.yml"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="group flex items-center justify-between rounded-sm p-2 text-sm text-base-content/60 hover:bg-base-200 hover:text-base-content"
                    >
                        <div class="flex items-center gap-2">
                            <HugeiconsIcon
                                icon={Idea01Icon}
                                size={16}
                                color="currentColor"
                                strokeWidth={2}
                            />
                            <span>Suggest a feature</span>
                        </div>
                        <span class="transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                            <HugeiconsIcon
                                icon={ArrowUpRight01Icon}
                                size={14}
                                color="currentColor"
                                strokeWidth={2}
                            />
                        </span>
                    </a>
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
