const DAY = 86400000;

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number, number][] = [
  ["second", 1000, 60],
  ["minute", 60000, 60],
  ["hour", 3600000, 24],
  ["day", DAY, 7],
];

/** "3 minutes ago" up to a week, then the full date and time. */
export const formatRelativeTime = (timestamp: number, locale: string, now = Date.now()) => {
  const diff = now - timestamp;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  for (const [unit, ms, limit] of RELATIVE_UNITS) {
    if (diff < ms * limit) return rtf.format(-Math.floor(diff / ms), unit);
  }
  const date = new Date(timestamp);
  return `${date.toLocaleDateString(locale)} ${date.toLocaleTimeString(locale)}`;
};

/** Locale of the extension UI in the BCP 47 form `Intl` expects. */
export const intlLocale = (locale: string) => locale.replace("_", "-");
