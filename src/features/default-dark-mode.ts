import { getDefaultDarkMode } from "@/utils/utils";

const COOKIE_TTL = 24 * 60 * 60 * 365;

const setDefaultDarkMode = (): { reload: boolean; url?: string } => {
    const odooVersion = getOdooVersion();
    const defaultDarkMode = getDefaultDarkMode();

    if (
        !odooVersion ||
        parseFloat(odooVersion) < 16.0 ||
        parseFloat(odooVersion) >= 19.0 ||
        defaultDarkMode === "false"
    )
        return { reload: false };

    const odooVersionNumber = parseFloat(odooVersion);
    const websiteCookies = document.cookie.split("; ");
    const cookiesMap = websiteCookies.reduce(
        (acc, cookie) => {
            const [key, value] = cookie.split("=");
            acc[key] = value;
            return acc;
        },
        {} as Record<string, string>,
    );

    let reload = false;
    if (
        odooVersionNumber < 18.0 &&
        cookiesMap["configured_color_scheme"] !== "dark"
    ) {
        reload = true;
        document.cookie = `configured_color_scheme=dark; path=/; max-age=${COOKIE_TTL}`;
    }

    if (cookiesMap["color_scheme"] !== "dark") {
        reload = true;
        document.cookie = `color_scheme=dark; path=/; max-age=${COOKIE_TTL}`;
    }

    return { reload };
};

export { setDefaultDarkMode };
