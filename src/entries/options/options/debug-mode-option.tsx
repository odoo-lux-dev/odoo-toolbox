import { HugeiconsIcon } from "@hugeicons/react";
import { InformationCircleIcon } from "@hugeicons/core-free-icons";
import { Alert } from "@/components/ui/alert";
import { Radio } from "@/components/ui/radio";
import { OptionItem } from "@/components/options/option-item";
import { useSettingValue } from "@/contexts/options-signals-hook";
import { settingsService } from "@/services/settings-service";
import { DebugModeType } from "@/types";
import { CHROME_STORAGE_SETTINGS_DEBUG_MODE_KEY } from "@/utils/constants";

export const DebugModeOption = () => {
    const debugModeSetting = useSettingValue(
        CHROME_STORAGE_SETTINGS_DEBUG_MODE_KEY,
    );

    const selectedMode =
        (debugModeSetting.value as DebugModeType) || "disabled";

    const handleChange = async (event: Event) => {
        const target = event.target as HTMLInputElement;
        const value = target.value as DebugModeType;
        await settingsService.setDebugMode(value);
    };

    const additionalTooltipContent = (
        <ul>
            <li>
                <strong>Disabled</strong> : Debug mode won't be forced
                <ul>
                    <li>
                        If it's triggered from the popup's toggle, it'll remove
                        the debug mode from the active URL
                    </li>
                    <li>
                        If you reach a website with an active debug mode in the
                        URL, it won't be removed nor replaced
                    </li>
                    <li>Basically: it's like the monkey extension 🙈</li>
                </ul>
            </li>
            <li>
                <strong>Always</strong> : Debug mode will always be enabled
            </li>
            <li>
                <strong>Assets</strong> : Debug mode will always be enabled to
                assets
            </li>
            <li>
                <strong>Tests assets</strong> : Debug mode will always be
                enabled to tests assets
            </li>
        </ul>
    );

    return (
        <OptionItem
            id="debug-mode"
            title="Debug mode"
            tooltipContent="Choose how you want to enable the debug mode"
            additionalTooltipContent={additionalTooltipContent}
        >
            <div id="debug-mode" className="flex flex-col gap-4">
                <Alert
                    color="info"
                    icon={
                        <HugeiconsIcon
                            icon={InformationCircleIcon}
                            size={20}
                            color="currentColor"
                            strokeWidth={2}
                        />
                    }
                    className="text-sm"
                    variant="dash"
                >
                    <span>
                        You can also configure this by clicking the bug icon
                        within the popup.
                        <br />A <strong>single click</strong> will toggle debug
                        mode, a <strong>double click</strong> will activate
                        assets debug, and a <strong>triple click</strong> will
                        activate tests assets debug.
                    </span>
                </Alert>

                <div className="flex flex-col gap-3">
                    <Radio
                        name="debug-mode"
                        className="radio-primary dark:radio-accent"
                        value="disabled"
                        checked={selectedMode === "disabled"}
                        onChange={handleChange}
                        label="Disabled"
                        size="sm"
                    />

                    <Radio
                        name="debug-mode"
                        className="radio-primary dark:radio-accent"
                        value="1"
                        checked={selectedMode === "1"}
                        onChange={handleChange}
                        label="Always"
                        size="sm"
                    />

                    <Radio
                        name="debug-mode"
                        className="radio-primary dark:radio-accent"
                        value="assets"
                        checked={selectedMode === "assets"}
                        onChange={handleChange}
                        label="Assets"
                        size="sm"
                    />

                    <Radio
                        name="debug-mode"
                        className="radio-primary dark:radio-accent"
                        value="assets,tests"
                        checked={selectedMode === "assets,tests"}
                        onChange={handleChange}
                        label="Tests assets"
                        size="sm"
                    />
                </div>
            </div>
        </OptionItem>
    );
};
