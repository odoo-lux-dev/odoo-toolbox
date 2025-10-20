export class ExtensionCommand {
    private readonly name: string;
    private readonly process: () => void;

    constructor(name: string, process: () => void) {
        this.name = name;
        this.process = process;
    }

    getName() {
        return this.name;
    }

    execute() {
        this.process();
    }
}
