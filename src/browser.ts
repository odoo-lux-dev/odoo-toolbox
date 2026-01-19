export const browser =
    import.meta.env.BROWSER !== "firefox"
        ? globalThis.chrome
        : globalThis.browser;
