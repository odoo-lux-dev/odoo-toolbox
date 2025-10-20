import { ExtensionAlarm } from "@/entries/background/extension-alarms.class";
import { configurationService } from "@/services/configuration-service";
import { Logger } from "@/services/logger";

const PersistLocalData = new ExtensionAlarm(
    "persist-local-data",
    {
        periodInMinutes: 1,
    },
    () =>
        configurationService
            .persistDataToSync()
            .then(() => Logger.info("Data saved to the cloud"))
            .catch((error: unknown) =>
                Logger.error(
                    "An error occured while saving data to the cloud",
                    error,
                ),
            ),
);

export { PersistLocalData };
