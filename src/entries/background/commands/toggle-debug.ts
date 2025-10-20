import { ExtensionCommand } from "@/entries/background/extension-command.class";
import { Logger } from "@/services/logger";
import { handleToggleDebugCommand } from "@/utils/background-utils";

const ToggleDebugCommand = new ExtensionCommand("toggle-debug", () =>
    handleToggleDebugCommand()
        .then(() => Logger.info("Debug mode toggled"))
        .catch((error) =>
            Logger.error("An error occured toggling debug mode", error),
        ),
);

export { ToggleDebugCommand };
