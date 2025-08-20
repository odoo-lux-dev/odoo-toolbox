import pkg from "@@/package.json"

export class Logger {
    private static prefix = `[${pkg.displayName ?? pkg.name}]`

    static info(...messages: unknown[]): void {
        console.info(this.prefix, ...messages)
    }

    static error(...messages: unknown[]): void {
        console.error(this.prefix, ...messages)
    }

    static log(...messages: unknown[]): void {
        console.log(this.prefix, ...messages)
    }

    static warn(...messages: unknown[]): void {
        console.warn(this.prefix, ...messages)
    }

    static debug(...messages: unknown[]): void {
        console.debug(this.prefix, ...messages)
    }
}
