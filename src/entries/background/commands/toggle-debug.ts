import { handleToggleDebugCommand } from "@/utils/background-utils"
import { Logger } from "@/utils/logger"
import { ExtensionCommand } from "@/entries/background/extension-command.class"

const ToggleDebugCommand = new ExtensionCommand("toggle-debug", () =>
  handleToggleDebugCommand()
    .then(() => Logger.info("Debug mode toggled"))
    .catch((error) =>
      Logger.error("An error occured toggling debug mode", error)
    )
)

export { ToggleDebugCommand }
