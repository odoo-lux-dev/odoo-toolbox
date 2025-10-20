import { BookOpen, Settings } from "lucide-preact";
import { useState } from "preact/hooks";
import { GithubIcon } from "@/components/shared/icons/github-icon";
import { Logger } from "@/services/logger";
import { updateService } from "@/services/update-service";
import { ActivationMethod } from "@/types";

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
                                icon: "❌",
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
        <div className="update-card">
            <div className="update-icon">🎉</div>
            <h1>{updateInfo.title || `Odoo Toolbox v${currentVersion}`}</h1>

            <p>
                {updateInfo.description ||
                    "Odoo Toolbox has been updated with new features and improvements."}
                <br />
                <small>
                    This notification only appears for significant updates worth
                    highlighting.
                </small>
            </p>

            {updateInfo.mainFeature && (
                <div className="update-feature-highlight">
                    <div className="feature-icon">
                        {updateInfo.mainFeature.icon}
                    </div>
                    <div className="feature-content">
                        <h3>{updateInfo.mainFeature.title}</h3>
                        <p>{updateInfo.mainFeature.description}</p>
                    </div>
                </div>
            )}

            {updateInfo.activationMethods &&
                updateInfo.activationMethods.length > 0 && (
                    <div className="update-activation-guide">
                        <h4>✨ How to activate</h4>
                        <div className="activation-methods">
                            {updateInfo.activationMethods.map(
                                (method, index) => {
                                    const currentState = buttonStates[index];
                                    const displayText =
                                        currentState?.text || method.text;
                                    const displayIcon =
                                        currentState?.icon || method.icon;
                                    const isDisabled =
                                        currentState?.disabled || false;

                                    return (
                                        <div
                                            key={index}
                                            className={`activation-method ${method.action ? "activation-method-clickable" : ""} ${isDisabled ? "activation-method-disabled" : ""}`}
                                            onClick={() =>
                                                !isDisabled &&
                                                method.action &&
                                                handleActivationMethodClick(
                                                    method,
                                                    index,
                                                )
                                            }
                                            role={
                                                method.action
                                                    ? "button"
                                                    : undefined
                                            }
                                            tabIndex={
                                                method.action && !isDisabled
                                                    ? 0
                                                    : undefined
                                            }
                                            onKeyDown={(e) => {
                                                if (
                                                    !isDisabled &&
                                                    method.action &&
                                                    e.key === "Enter"
                                                ) {
                                                    e.preventDefault();
                                                    handleActivationMethodClick(
                                                        method,
                                                        index,
                                                    );
                                                }
                                            }}
                                        >
                                            <span className="method-icon">
                                                {displayIcon}
                                            </span>
                                            <span>{displayText}</span>
                                        </div>
                                    );
                                },
                            )}
                        </div>
                    </div>
                )}

            {updateInfo.customSections &&
                updateInfo.customSections.length > 0 && (
                    <div className="update-custom-sections">
                        {updateInfo.customSections.map((section, index) => (
                            <div
                                key={index}
                                className={`update-custom-section update-custom-section-${section.type}`}
                            >
                                <h4>{section.title}</h4>
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: section.content,
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                )}

            {updateInfo.notes.length > 0 && (
                <div className="update-highlights">
                    <h3>🚀 What's New</h3>
                    <ul>
                        {updateInfo.notes.map((note, index) => {
                            const emojiMatch = note.match(/^(\p{Emoji})\s*/u);
                            const emoji = emojiMatch ? emojiMatch[1] : "";
                            const text = emojiMatch
                                ? note.slice(emojiMatch[0].length)
                                : note;

                            return (
                                <li key={index} className="update-note-item">
                                    {emoji && (
                                        <span className="note-emoji">
                                            {emoji}
                                        </span>
                                    )}
                                    <span className="note-text">{text}</span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}

            <div className="buttons">
                <button className="btn btn-primary" onClick={openOptions}>
                    <Settings size={18} />
                    Open Settings
                </button>
                <button className="btn btn-secondary" onClick={openChangelog}>
                    <BookOpen size={16} />
                    View Changelog
                </button>
                <button className="btn btn-tertiary" onClick={openGitHub}>
                    <GithubIcon />
                    GitHub
                </button>
            </div>
        </div>
    );
};
