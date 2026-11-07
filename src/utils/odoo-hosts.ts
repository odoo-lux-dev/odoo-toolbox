const LOCAL_HOSTNAME_REGEXES = [
  /^localhost$/,
  /\.localhost$/,
  /^::1$/,
  /^0\.0\.0\.0$/,
  /^127\.\d+\.\d+\.\d+$/, // loopback
  /^10\.\d+\.\d+\.\d+$/, // RFC 1918
  /^192\.168\.\d+\.\d+$/, // RFC 1918
  /^169\.254\.\d+\.\d+$/, // link-local
  /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/, // RFC 1918
];

const RUNBOT_FRONTEND_HOSTNAME_REGEX = /^(?:www\.)?runbot\d*\.odoo\.com$/;
const RUNBOT_BUILD_HOSTNAME_REGEX = /^(?!www\.)[^.]+\.runbot\d*\.odoo\.com$/;

export const isRunbotFrontendHost = (hostname: string): boolean =>
  RUNBOT_FRONTEND_HOSTNAME_REGEX.test(hostname);

export const isRunbotBuildHost = (hostname: string): boolean =>
  RUNBOT_BUILD_HOSTNAME_REGEX.test(hostname);

const isLocalHost = (hostname: string): boolean =>
  LOCAL_HOSTNAME_REGEXES.some((regex) => regex.test(hostname));

/**
 * Detects whether the current database is hosted on Odoo.sh: every response it serves
 * carries a `Server: Odoo.sh` header.
 */
export const isOdooShHosted = async (): Promise<boolean> => {
  const { hostname, origin } = window.location;
  if (isRunbotBuildHost(hostname) || isRunbotFrontendHost(hostname) || isLocalHost(hostname)) {
    return false;
  }

  try {
    const response = await fetch(origin, {
      method: "GET",
      cache: "no-store",
      headers: { accept: "text/html" },
    });
    return response.headers.get("server")?.trim().toLowerCase() === "odoo.sh";
  } catch {
    return false;
  }
};
