import {
  alignLocalDataWithSyncedData,
  importConfiguration,
} from "@/utils/storage"
import { alarms, checkAndHandleAlarms } from "@/entries/background/alarms"
import { commands } from "@/entries/background/commands"

export default defineBackground(() => {
  browser.runtime.onStartup.addListener(async () => {
    await alignLocalDataWithSyncedData()
    await checkAndHandleAlarms()
  })

  browser.runtime.onInstalled.addListener(async () => {
    await alignLocalDataWithSyncedData()
    await checkAndHandleAlarms()
  })

  browser.alarms.onAlarm.addListener((alarm) => {
    const alarmInstance = alarms.find((a) => a.getName() === alarm.name)
    if (alarmInstance) alarmInstance.execute()
  })

  browser.commands.onCommand.addListener((command) => {
    const commandInstance = commands.find((c) => c.getName() === command)
    if (commandInstance) commandInstance.execute()
  })

  browser.runtime.onMessageExternal.addListener(
    (request, sender, sendResponse) => {
      const currentBrowser = import.meta.env.BROWSER
      const isChromiumBased = ["chrome", "edge", "opera"].includes(
        currentBrowser
      )

      const publicExtensionId = isChromiumBased
        ? "fkgeepkgoihjhiinffddgjmdkhelpnfo"
        : "odoo_sh_extension@thcl-saju"

      if (sender.id !== publicExtensionId) return
      importConfiguration(request.config)
        .then(() => {
          sendResponse({
            status: "success",
            message: "Configuration migrated successfully",
          })
        })
        .catch((error) => {
          sendResponse({
            status: "error",
            message: `Failed to migrate configuration: ${error.message}`,
          })
        })
    }
  )
})
