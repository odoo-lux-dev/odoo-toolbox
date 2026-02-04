import { OptionItem } from "@/components/options/option-item";
import { Toggle } from "@/components/ui/toggle";
import { Join } from "@/components/ui/join";
import { useSettingValue } from "@/contexts/options-signals-hook";
import { settingsService } from "@/services/settings-service";
import {
    CHROME_STORAGE_SETTINGS_SHOW_TECHNICAL_LIST,
    CHROME_STORAGE_SETTINGS_TECHNICAL_LIST_POSITION,
} from "@/utils/constants";

export const TechnicalListOption = () => {
    const technicalListEnabled = useSettingValue(
        CHROME_STORAGE_SETTINGS_SHOW_TECHNICAL_LIST,
    );

    const handleChange = async (checked: boolean) => {
        await settingsService.setShowTechnicalList(checked);
    };

    const technicalListPosition = useSettingValue(
        CHROME_STORAGE_SETTINGS_TECHNICAL_LIST_POSITION,
    );
    const selectedPosition =
        (technicalListPosition.value as "left" | "right") || "right";

    const setPosition = async (value: "left" | "right") => {
        await settingsService.setTechnicalListPosition(value);
    };

    const isEnabled = !!technicalListEnabled.value;

    const additionalTooltipContent = (
        <div>
            <p>
                <strong>Sidebar features:</strong>
            </p>
            <ul>
                <li>
                    <strong>Field information</strong> : types, properties,
                    debug data
                </li>
                <li>
                    <strong>Database details</strong> : version, user, company
                    info
                </li>
                <li>
                    <strong>Website context</strong> : when on frontend pages
                </li>
                <li>
                    <strong>Element selector mode</strong> : click to select
                    fields
                </li>
                <li>
                    <strong>Copy-to-clipboard</strong> functionality for all
                    values
                </li>
                <li>
                    <strong>Field highlighting</strong> on hover
                </li>
            </ul>
            <p>
                <strong>Version compatibility:</strong>
            </p>
            <ul>
                <li>
                    ✅ <strong>Fully stable from Odoo v16+</strong>
                </li>
                <li>
                    ⚠️ <strong>Earlier versions</strong> may have limited
                    informations
                </li>
                <li>
                    🌐 <strong>Works on both</strong> backend and website pages
                </li>
            </ul>
        </div>
    );

    return (
        <OptionItem
            id="technical-list"
            title="Enable technical sidebar"
            tooltipContent="Enable an advanced technical sidebar with comprehensive field and system information"
            additionalTooltipContent={additionalTooltipContent}
        >
            <div className="flex flex-col gap-3">
                <div className="flex items-center">
                    <Toggle
                        className="toggle-primary dark:toggle-accent"
                        size="sm"
                        checked={isEnabled}
                        onCheckedChange={handleChange}
                    />
                </div>
                {isEnabled && (
                    <div className="flex items-center justify-between text-xs text-base-content/70">
                        <span className="font-medium">Sidebar position</span>
                        <Join>
                            <button
                                type="button"
                                className={[
                                    "btn",
                                    "btn-sm",
                                    "join-item",
                                    selectedPosition === "left"
                                        ? "btn-primary text-primary-content dark:btn-accent dark:text-accent-content"
                                        : "btn-ghost",
                                ].join(" ")}
                                onClick={() => setPosition("left")}
                                aria-pressed={selectedPosition === "left"}
                            >
                                Left
                            </button>
                            <button
                                type="button"
                                className={[
                                    "btn",
                                    "btn-sm",
                                    "join-item",
                                    selectedPosition === "right"
                                        ? "btn-primary text-primary-content dark:btn-accent dark:text-accent-content"
                                        : "btn-ghost",
                                ].join(" ")}
                                onClick={() => setPosition("right")}
                                aria-pressed={selectedPosition === "right"}
                            >
                                Right
                            </button>
                        </Join>
                    </div>
                )}
            </div>
        </OptionItem>
    );
};
