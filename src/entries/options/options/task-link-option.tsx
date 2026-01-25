import { useComputed, useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { OptionItem } from "@/components/options/option-item";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useOptions } from "@/contexts/options-signals-hook";
import { settingsService } from "@/services/settings-service";
import {
    CHROME_STORAGE_SETTINGS_TASK_URL,
    CHROME_STORAGE_SETTINGS_TASK_URL_REGEX,
    URL_CHECK_REGEX,
} from "@/utils/constants";
import { isValidRegex } from "@/utils/regex";
import { HugeiconsIcon } from "@hugeicons/react";
import {
    FloppyDiskIcon,
    InformationCircleIcon,
} from "@hugeicons/core-free-icons";

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

    return (
        <OptionItem
            id="task-link"
            title="Task link on SH branch page"
            tooltipContent="Specify an URL to redirect to when clicking on the task link icon on SH branch page. Leave it empty to disable the feature."
            // additionalTooltipContent={additionalTooltipContent}
        >
            <div className="flex flex-col gap-6">
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
                    <ul>
                        <li>
                            Use <i>{"{{task_id}}"}</i> placeholder to replace it
                            with the task ID
                        </li>
                        <li>
                            By default, it's triggered with the following
                            pattern: <i>VERSION-TASKID-OPTIONAL_DESCRIPTION</i>{" "}
                            (e.g. 17.0-12345 , 15.0-6789-fixes)
                        </li>
                        <li>
                            You can set up a specific URL per favorite from the
                            "SH Favorites" page
                        </li>
                    </ul>
                </Alert>
                <div className="flex flex-col gap-2">
                    <label
                        className="text-sm font-medium"
                        htmlFor="task-link-option"
                    >
                        Task link
                    </label>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Input
                            id="task-link-option"
                            className={urlHasError.value ? "input-error" : ""}
                            type="text"
                            fullWidth
                            placeholder="https://www.odoo.com/odoo/project.task/{{task_id}}"
                            value={taskUrl.value}
                            onInput={handleTaskUrlChange}
                        />
                        <Button
                            size="sm"
                            variant="outline"
                            className={
                                showUrlSaveButton.value ? "" : "invisible"
                            }
                            onClick={handleUrlSave}
                        >
                            <HugeiconsIcon
                                icon={FloppyDiskIcon}
                                size={18}
                                color="currentColor"
                                strokeWidth={2}
                            />{" "}
                            Save
                        </Button>
                    </div>
                    {urlHasError.value ? (
                        <Alert color="error" variant="soft" className="text-sm">
                            Link seems incorrect. Please verify.
                        </Alert>
                    ) : null}
                </div>

                <div className="flex flex-col gap-2">
                    <label
                        className="text-sm font-medium"
                        htmlFor="task-link-option-regex"
                    >
                        Branch name regex
                    </label>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Input
                            id="task-link-option-regex"
                            className={regexHasError.value ? "input-error" : ""}
                            type="text"
                            fullWidth
                            placeholder="/^\d+(?:\.\d+)?-(\d+)(?:-.+)?$/"
                            value={regexPattern.value}
                            onInput={handleRegexChange}
                        />
                        <Button
                            size="sm"
                            variant="outline"
                            className={
                                showRegexSaveButton.value ? "" : "invisible"
                            }
                            onClick={handleRegexSave}
                        >
                            <HugeiconsIcon
                                icon={FloppyDiskIcon}
                                size={18}
                                color="currentColor"
                                strokeWidth={2}
                            />{" "}
                            Save
                        </Button>
                    </div>
                    {regexHasError.value ? (
                        <Alert color="error" variant="soft" className="text-sm">
                            Regex seems incorrect. Please verify.
                        </Alert>
                    ) : null}
                </div>
            </div>
        </OptionItem>
    );
};
