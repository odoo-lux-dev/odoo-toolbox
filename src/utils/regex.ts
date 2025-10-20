import { settingsService } from "@/services/settings-service";

const isValidRegex = (userInput: string) => {
    try {
        const { pattern, flags } = parseRegexInput(userInput);
        new RegExp(pattern, flags);
        return true;
    } catch (_e) {
        return false;
    }
};

const parseRegexInput = (input: string) => {
    const regex = /^\/(.+)\/([a-z]*)$/;
    const match = input.match(regex);
    if (match) {
        return { pattern: match[1], flags: match[2] };
    } else {
        return { pattern: input, flags: "" };
    }
};

const parseTaskTitle = async (taskTitle: string) => {
    const currentPattern = await settingsService.getTaskRegex();
    if (isValidRegex(currentPattern)) {
        const { pattern, flags } = parseRegexInput(currentPattern);
        const userRegex = new RegExp(pattern, flags);
        return userRegex.exec(taskTitle);
    }
    return null;
};

export { isValidRegex, parseRegexInput, parseTaskTitle };
