import { useComputed, useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { OptionItem } from "@/components/options/option-item";
import { useOptions } from "@/contexts/options-signals-hook";
import { settingsService } from "@/services/settings-service";
import {
    CHROME_STORAGE_SETTINGS_TASK_URL,
    CHROME_STORAGE_SETTINGS_TASK_URL_REGEX,
    URL_CHECK_REGEX,
} from "@/utils/constants";
import { isValidRegex } from "@/utils/regex";

export const TaskLinkOption = () => {
    const taskUrl = useSignal("");
    const regexPattern = useSignal("");
    const initialTaskUrl = useSignal("");
    const initialRegexPattern = useSignal("");

    const urlHasError = useComputed(() => {
        const value = taskUrl.value;
        return (
            !URL_CHECK_REGEX.test(value) && value !== "" && value.length > 10
        );
    });

    const regexHasError = useComputed(() => {
        const value = regexPattern.value;
        return !isValidRegex(value) && value.length > 10;
    });

    const showUrlSaveButton = useComputed(() => {
        const value = taskUrl.value;
        const hasChanged = value !== initialTaskUrl.value;
        const isValidUrl = URL_CHECK_REGEX.test(value) || value === "";
        return hasChanged && isValidUrl;
    });

    const showRegexSaveButton = useComputed(() => {
        const value = regexPattern.value;
        const hasChanged = value !== initialRegexPattern.value;
        const isValid = isValidRegex(value);
        return hasChanged && isValid;
    });

    const { settings } = useOptions();

    useEffect(() => {
        const savedTaskUrl = settings?.[CHROME_STORAGE_SETTINGS_TASK_URL] || "";
        taskUrl.value = savedTaskUrl;
        initialTaskUrl.value = savedTaskUrl;
    }, [settings?.[CHROME_STORAGE_SETTINGS_TASK_URL]]);

    useEffect(() => {
        const savedRegexPattern =
            settings?.[CHROME_STORAGE_SETTINGS_TASK_URL_REGEX] || "";
        regexPattern.value = savedRegexPattern;
        initialRegexPattern.value = savedRegexPattern;
    }, [settings?.[CHROME_STORAGE_SETTINGS_TASK_URL_REGEX]]);

    const handleTaskUrlChange = (e: Event) => {
        const value = (e.target as HTMLInputElement).value;
        taskUrl.value = value;
    };

    const handleRegexChange = (e: Event) => {
        const value = (e.target as HTMLInputElement).value;
        regexPattern.value = value;
    };

    const handleUrlSave = async (e: Event) => {
        e.preventDefault();

        if (!URL_CHECK_REGEX.test(taskUrl.value) && taskUrl.value !== "") {
            return;
        }

        await settingsService.setGlobalTaskUrl(taskUrl.value);
        initialTaskUrl.value = taskUrl.value;
    };

    const handleRegexSave = async (e: Event) => {
        e.preventDefault();

        if (!isValidRegex(regexPattern.value)) {
            return;
        }

        await settingsService.setTaskRegex(regexPattern.value);
        initialRegexPattern.value = regexPattern.value;
    };

    const additionalTooltipContent = (
        <ul>
            <li>Leave it empty to disable the feature</li>
            <li>
                Use <i>{"{{task_id}}"}</i> placeholder to replace it with the
                task ID
            </li>
            <li>
                By default, it's triggered with the following pattern:{" "}
                <i>VERSION-TASKID-OPTIONAL_DESCRIPTION</i>
                <br />
                Examples:
                <ul>
                    <li>17.0-12345</li>
                    <li>15.0-6789-fixes</li>
                </ul>
            </li>
            <li>
                If you want to use a different nomenclature, you can customize
                the regex
            </li>
            <li>
                If you want to use a different URL for a favorite project, you
                can set it from the "SH Favorites" page
            </li>
        </ul>
    );

    return (
        <OptionItem
            id="task-link"
            title="Task link on SH branch page"
            tooltipContent="Specify an URL to redirect to when clicking on the task link icon on SH branch page"
            additionalTooltipContent={additionalTooltipContent}
        >
            <div className="x-odoo-options-page-task-link-category">
                <div>
                    <div>
                        <div className="x-options-form-group">
                            <input
                                id="task-link-option"
                                className={`x-options-input ${urlHasError.value ? "has-error" : ""}`}
                                type="text"
                                placeholder="https://www.odoo.com/odoo/project.task/{{task_id}}"
                                value={taskUrl.value}
                                onInput={handleTaskUrlChange}
                            />
                            <label htmlFor="task-link-option">Task link</label>
                        </div>
                        <button
                            id="task-link-option-save-button"
                            className="x-odoo-options-page-task-link-save-button"
                            style={{
                                visibility: showUrlSaveButton.value
                                    ? "visible"
                                    : "hidden",
                            }}
                            onClick={handleUrlSave}
                        >
                            💾
                        </button>
                    </div>
                    {urlHasError.value && (
                        <span
                            className="x-odoo-options-page-task-link-error-message"
                            style={{ display: "block" }}
                        >
                            Link seems incorrect. Please verify.
                        </span>
                    )}
                </div>

                <div>
                    <div>
                        <div className="x-options-form-group">
                            <input
                                id="task-link-option-regex"
                                className={`x-options-input ${regexHasError.value ? "has-error" : ""}`}
                                type="text"
                                placeholder="/^\d+(?:\.\d+)?-(\d+)(?:-.+)?$/"
                                value={regexPattern.value}
                                onInput={handleRegexChange}
                            />
                            <label htmlFor="task-link-option-regex">
                                Branch name regex
                            </label>
                        </div>
                        <button
                            id="task-link-option-save-button-regex"
                            className="x-odoo-options-page-task-link-save-button"
                            style={{
                                visibility: showRegexSaveButton.value
                                    ? "visible"
                                    : "hidden",
                            }}
                            onClick={handleRegexSave}
                        >
                            💾
                        </button>
                    </div>
                    {regexHasError.value && (
                        <span
                            className="x-odoo-options-page-task-link-regex-error-message"
                            style={{ display: "block" }}
                        >
                            Regex seems incorrect. Please verify.
                        </span>
                    )}
                </div>
            </div>
        </OptionItem>
    );
};
