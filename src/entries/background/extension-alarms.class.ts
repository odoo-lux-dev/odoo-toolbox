import { AlarmOption } from "@/types";

export class ExtensionAlarm {
    private readonly name: string;
    private readonly options: Partial<AlarmOption>;
    private readonly process: () => void;

    constructor(
        name: string,
        options: Partial<AlarmOption>,
        process: () => void,
    ) {
        this.name = name;
        this.options = options;
        this.process = process;
    }

    getName() {
        return this.name;
    }

    getOptions() {
        return this.options;
    }

    execute() {
        this.process();
    }
}
