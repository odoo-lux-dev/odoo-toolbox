import { PersistLocalData } from "@/entries/background/alarms/persist-local-data";
import { Logger } from "@/services/logger";

const alarms = [PersistLocalData];

const checkAndHandleAlarms = () => {
    browser.alarms.getAll().then((existingAlarms) => {
        const neededAlarmsNames = alarms.map((alarm) => alarm.getName());
        const unusedAlarms = existingAlarms.filter(
            (alarm) => !neededAlarmsNames.includes(alarm.name),
        );
        for (const unusedAlarm of unusedAlarms) {
            browser.alarms.clear(unusedAlarm.name).then(() => {
                Logger.info(`Cleared alarm ${unusedAlarm.name}`);
            });
        }
        for (const alarm of alarms) {
            if (
                !existingAlarms.some(
                    (existingAlarm) => existingAlarm.name === alarm.getName(),
                )
            ) {
                browser.alarms.create(alarm.getName(), alarm.getOptions());
                Logger.info(`Created alarm ${alarm.getName()}`);
            }
        }
    });
};

export { checkAndHandleAlarms, alarms };
