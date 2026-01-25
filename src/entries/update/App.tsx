import "./style.css";
import { useEffect, useState } from "preact/hooks";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    Alert02Icon,
    BookOpen01Icon,
    ChartBarLineIcon,
    GithubIcon,
    InformationCircleIcon,
    Loading03Icon,
    Rocket01Icon,
    Settings02Icon,
    SparklesIcon,
    Tick01Icon,
    Wrench01Icon,
} from "@hugeicons/core-free-icons";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logger } from "@/services/logger";
import { settingsService } from "@/services/settings-service";
import { updateService } from "@/services/update-service";
import { ActivationMethod } from "@/types";

const iconMap: Record<string, typeof SparklesIcon> = {
    "wrench-01": Wrench01Icon,
    "rocket-01": Rocket01Icon,
    "chart-bar-line": ChartBarLineIcon,
    "settings-02": Settings02Icon,
    "alert-02": Alert02Icon,
    "loading-03": Loading03Icon,
    "tick-01": Tick01Icon,
    github: GithubIcon,
};

const getIcon = (iconName?: string) =>
    (iconName && iconMap[iconName]) || SparklesIcon;

const renderIcon = (
    iconName: string | undefined,
    size: number,
    className?: string,
) => (
    <HugeiconsIcon
        icon={getIcon(iconName)}
        size={size}
        color="currentColor"
        strokeWidth={1.8}
        className={className}
    />
);

const getSectionIcon = (type: "info" | "warning" | "success") => {
    switch (type) {
        case "warning":
            return Alert02Icon;
        case "success":
            return Tick01Icon;
        default:
            return InformationCircleIcon;
    }
};

export const App = () => {
    const currentVersion = browser.runtime.getManifest().version;
    const updateInfo = updateService.getUpdateInfo(currentVersion);
    const [buttonStates, setButtonStates] = useState<
        Record<
            number,
            {
                text: string;
                icon: string;
                disabled?: boolean;
            }
        >
    >({});

    useEffect(() => {
        let isMounted = true;

        const applyTheme = (extensionTheme?: string) => {
            const themeName =
                extensionTheme === "light" ? "odoolight" : "odoodark";
            document.documentElement.setAttribute("data-theme", themeName);
        };

        settingsService.getSettings().then((settings) => {
            if (!isMounted) return;
            applyTheme(settings.extensionTheme);
        });

        const unwatch = settingsService.watchSettings((newSettings) => {
            if (!newSettings) return;
            applyTheme(newSettings.extensionTheme);
        });

        return () => {
            isMounted = false;
            unwatch();
        };
    }, []);

    const openOptions = () => {
        browser.runtime.openOptionsPage();
    };

    const openGitHub = () => {
        browser.tabs.create({
            url: "https://github.com/odoo-lux-dev/odoo-toolbox",
        });
    };

    const openChangelog = () => {
        browser.tabs.create({
            url: `https://github.com/odoo-lux-dev/odoo-toolbox/releases/tag/v${currentVersion}`,
        });
    };

    const handleActivationMethodClick = (
        method: ActivationMethod,
        index: number,
    ) => {
        switch (method.action) {
            case "openSettings":
                openOptions();
                break;
            case "openUrl":
                if (method.url) {
                    browser.tabs.create({ url: method.url });
                    window.close();
                }
                break;
            case "custom":
                if (
                    method.customHandler &&
                    typeof method.customHandler === "function"
                ) {
                    try {
                        const updateButtonState = (newState: {
                            text: string;
                            icon: string;
                            disabled?: boolean;
                        }) => {
                            setButtonStates((prev) => ({
                                ...prev,
                                [index]: newState,
                            }));
                        };
                        method.customHandler(updateButtonState);
                    } catch (error) {
                        Logger.error("Error executing custom handler:", error);
                        setButtonStates((prev) => ({
                            ...prev,
                            [index]: {
                                text: "Error occurred",
                                icon: "alert-02",
                                disabled: true,
                            },
                        }));
                        setTimeout(() => {
                            setButtonStates((prev) => {
                                const newStates = { ...prev };
                                delete newStates[index];
                                return newStates;
                            });
                        }, 3000);
                    }
                }
                break;
            default:
                break;
        }
    };

    return (
        <div className="min-h-screen bg-base-200 text-base-content flex items-center justify-center px-4 py-8">
            <Card className="w-full max-w-2xl bg-base-100 shadow-xl">
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between gap-4">
                        <h1 className="text-2xl font-semibold">
                            {updateInfo.title || "Odoo Toolbox"}
                        </h1>
                        <Badge color="primary" size="sm">
                            {updateInfo.updateVersion || currentVersion}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-primary/15 p-3 text-primary">
                            <HugeiconsIcon
                                icon={SparklesIcon}
                                size={20}
                                color="currentColor"
                                strokeWidth={1.8}
                            />
                        </div>
                        <p className="text-sm text-base-content/70">
                            {updateInfo.description ||
                                "Odoo Toolbox has been updated with new features and improvements."}
                        </p>
                    </div>

                    <p className="text-sm text-base-content/60 text-center">
                        This notification only appears for significant updates
                        worth highlighting.
                    </p>

                    {updateInfo.mainFeature ? (
                        <Card className="bg-base-200/60 border border-base-300">
                            <div className="flex items-center gap-4">
                                <div className="rounded-lg bg-primary/15 p-2 text-primary">
                                    {renderIcon(
                                        updateInfo.mainFeature.icon,
                                        18,
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-lg font-semibold">
                                        {updateInfo.mainFeature.title}
                                    </h2>
                                    <p className="text-sm text-base-content/70">
                                        {updateInfo.mainFeature.description}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    ) : null}

                    {updateInfo.activationMethods &&
                    updateInfo.activationMethods.length > 0 ? (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2 text-sm font-semibold text-base-content/80">
                                <HugeiconsIcon
                                    icon={Rocket01Icon}
                                    size={16}
                                    color="currentColor"
                                    strokeWidth={1.8}
                                />
                                <span>How to activate</span>
                            </div>
                            <div className="flex flex-col gap-2">
                                {updateInfo.activationMethods.map(
                                    (method, index) => {
                                        const currentState =
                                            buttonStates[index];
                                        const displayText =
                                            currentState?.text || method.text;
                                        const displayIconName =
                                            currentState?.icon || method.icon;
                                        const isDisabled =
                                            currentState?.disabled || false;
                                        const isClickable =
                                            !!method.action && !isDisabled;
                                        const iconClassName =
                                            displayIconName?.startsWith(
                                                "loading",
                                            )
                                                ? "animate-spin"
                                                : undefined;

                                        if (isClickable) {
                                            return (
                                                <Button
                                                    key={index}
                                                    variant="outline"
                                                    color="primary"
                                                    block
                                                    className="justify-start gap-3"
                                                    disabled={isDisabled}
                                                    onClick={() =>
                                                        handleActivationMethodClick(
                                                            method,
                                                            index,
                                                        )
                                                    }
                                                >
                                                    {renderIcon(
                                                        displayIconName,
                                                        16,
                                                        iconClassName,
                                                    )}
                                                    <span>{displayText}</span>
                                                </Button>
                                            );
                                        }

                                        return (
                                            <div
                                                key={index}
                                                className={`flex items-center gap-3 rounded-lg border border-base-300 bg-base-200/60 px-4 py-3 text-sm ${isDisabled ? "opacity-60" : ""}`}
                                            >
                                                {renderIcon(
                                                    displayIconName,
                                                    16,
                                                    iconClassName,
                                                )}
                                                <span>{displayText}</span>
                                            </div>
                                        );
                                    },
                                )}
                            </div>
                        </div>
                    ) : null}

                    {updateInfo.customSections &&
                    updateInfo.customSections.length > 0 ? (
                        <div className="flex flex-col gap-3">
                            {updateInfo.customSections.map((section, index) => (
                                <Alert
                                    key={index}
                                    color={section.type}
                                    variant="soft"
                                    icon={
                                        <HugeiconsIcon
                                            icon={getSectionIcon(section.type)}
                                            size={18}
                                            color="currentColor"
                                            strokeWidth={1.8}
                                        />
                                    }
                                    title={section.title}
                                >
                                    <div
                                        className="text-sm text-base-content/80"
                                        dangerouslySetInnerHTML={{
                                            __html: section.content,
                                        }}
                                    />
                                </Alert>
                            ))}
                        </div>
                    ) : null}

                    {updateInfo.notes.length > 0 ? (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2 text-sm font-semibold text-base-content/80">
                                <HugeiconsIcon
                                    icon={SparklesIcon}
                                    size={16}
                                    color="currentColor"
                                    strokeWidth={1.8}
                                />
                                <span>What's new</span>
                            </div>
                            <ul className="space-y-2 text-sm text-base-content/75">
                                {updateInfo.notes.map((note, index) => (
                                    <li
                                        key={index}
                                        className="flex items-center gap-2"
                                    >
                                        <span className="mt-1 h-2 w-2 rounded-full bg-primary/70" />
                                        <span>{note}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : null}

                    <div className="flex flex-wrap gap-3">
                        <Button
                            color="primary"
                            className="gap-2 flex-1"
                            onClick={openOptions}
                        >
                            <HugeiconsIcon
                                icon={Settings02Icon}
                                size={16}
                                color="currentColor"
                                strokeWidth={1.8}
                            />
                            Open Settings
                        </Button>
                        <div className="flex w-full gap-2">
                            <Button
                                variant="outline"
                                color="secondary"
                                className="gap-2 flex-1"
                                onClick={openChangelog}
                            >
                                <HugeiconsIcon
                                    icon={BookOpen01Icon}
                                    size={16}
                                    color="currentColor"
                                    strokeWidth={1.8}
                                />
                                Changelog
                            </Button>
                            <Button
                                variant="outline"
                                className="gap-2 flex-1"
                                onClick={openGitHub}
                            >
                                <HugeiconsIcon
                                    icon={GithubIcon}
                                    size={16}
                                    color="currentColor"
                                    strokeWidth={1.8}
                                />
                                GitHub
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};
