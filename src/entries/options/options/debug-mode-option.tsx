import { DebugModeTips } from "@/components/options/debug-mode-tips"
import { OptionItem } from "@/components/options/option-item"
import { useOptions } from "@/contexts/options-signals-hook"
import { settingsService } from "@/services/settings-service"
import { DebugModeType } from "@/types"
import { CHROME_STORAGE_SETTINGS_DEBUG_MODE_KEY } from "@/utils/constants"

export const DebugModeOption = () => {
    const { settings } = useOptions()

    const selectedMode =
        (settings?.[CHROME_STORAGE_SETTINGS_DEBUG_MODE_KEY] as DebugModeType) ||
        "disabled"

    const handleChange = async (event: Event) => {
        const target = event.target as HTMLInputElement
        const value = target.value as DebugModeType
        await settingsService.setDebugMode(value)
    }

    const additionalTooltipContent = (
        <ul>
            <li>
                [Disabled] Debug mode won't be forced
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
            <li>[Always] Debug mode will always be enabled</li>
            <li>[Assets] Debug mode will always be enabled to assets</li>
            <li>
                [Tests assets] Debug mode will always be enabled to tests assets
            </li>
        </ul>
    )

    return (
        <OptionItem
            id="debug-mode"
            title="Debug mode"
            tooltipContent="Choose how you want to enable the debug mode"
            additionalTooltipContent={additionalTooltipContent}
        >
            <div id="debug-mode">
                <DebugModeTips>
                    <span>
                        You can also configure this by clicking the bug icon
                        within the popup.
                        <br />A <strong>single click</strong> will toggle debug
                        mode, a <strong>double click</strong> will activate
                        assets debug, and a <strong>triple click</strong> will
                        activate tests assets debug.
                    </span>
                </DebugModeTips>

                <label>
                    <input
                        type="radio"
                        name="debug-mode"
                        value="disabled"
                        checked={selectedMode === "disabled"}
                        onInput={handleChange}
                    />
                    <span className="checkmark"></span>
                    Disabled
                </label>

                <label>
                    <input
                        type="radio"
                        name="debug-mode"
                        value="1"
                        checked={selectedMode === "1"}
                        onInput={handleChange}
                    />
                    <span className="checkmark"></span>
                    Always
                </label>

                <label>
                    <input
                        type="radio"
                        name="debug-mode"
                        value="assets"
                        checked={selectedMode === "assets"}
                        onInput={handleChange}
                    />
                    <span className="checkmark"></span>
                    Assets
                </label>

                <label>
                    <input
                        type="radio"
                        name="debug-mode"
                        value="assets,tests"
                        checked={selectedMode === "assets,tests"}
                        onInput={handleChange}
                    />
                    <span className="checkmark"></span>
                    Tests assets
                </label>
            </div>
        </OptionItem>
    )
}
