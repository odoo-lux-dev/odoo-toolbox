import { ExtensionAlarm } from "@/entries/background/extension-alarms.class"
import { persistDataToSync } from "@/utils/storage"
import { Logger } from "@/utils/logger"

const PersistLocalData = new ExtensionAlarm(
  "persist-local-data",
  {
    periodInMinutes: 1,
  },
  () =>
    persistDataToSync()
      .then(() => Logger.info("Data saved to the cloud"))
      .catch((error) =>
        Logger.error("An error occured while saving data to the cloud", error)
      )
)

export { PersistLocalData }
