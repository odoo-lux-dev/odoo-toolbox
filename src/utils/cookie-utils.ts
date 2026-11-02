type CookieOptions = {
  maxAge?: number;
  path?: string;
};

/**
 * Returns the decoded value of a cookie, or null when it is not set.
 */
const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;

  try {
    const prefix = `${name}=`;
    const entry = document.cookie
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(prefix));

    if (!entry) return null;

    const value = entry.slice(prefix.length);
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  } catch {
    return null;
  }
};

const setCookie = (
  name: string,
  value: string,
  { maxAge, path = "/" }: CookieOptions = {},
): void => {
  const maxAgeAttribute = maxAge === undefined ? "" : `; max-age=${maxAge}`;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=${path}${maxAgeAttribute}`;
};

const removeCookie = (name: string): void => {
  document.cookie = `${name}=; path=/; max-age=0`;
};

export { getCookie, removeCookie, setCookie };
export type { CookieOptions };
