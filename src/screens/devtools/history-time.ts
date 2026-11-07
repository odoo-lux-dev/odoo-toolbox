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

export const startOfDay = (timestamp: number) => {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

/** "Today", "Yesterday", then the weekday and date. */
export const formatDayLabel = (day: number, locale: string, now = Date.now()) => {
  const diff = Math.round((day - startOfDay(now)) / DAY);
  if (diff >= -1) {
    const label = new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(diff, "day");
    return label.charAt(0).toLocaleUpperCase(locale) + label.slice(1);
  }
  return new Date(day).toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};

/** Locale of the extension UI in the BCP 47 form `Intl` expects. */
export const intlLocale = (locale: string) => locale.replace("_", "-");

export interface HistoryGroup<T> {
  key: string;
  label: string;
  actions: T[];
}

/** Pinned actions first, then the others grouped by calendar day (actions sorted newest first). */
export const groupByDay = <T extends { pinned?: boolean; timestamp: number }>(
  actions: T[],
  labels: { pinned: string; day: (day: number) => string },
): HistoryGroup<T>[] => {
  const groups: HistoryGroup<T>[] = [];
  const pinned = actions.filter((action) => action.pinned);
  if (pinned.length > 0) groups.push({ key: "pinned", label: labels.pinned, actions: pinned });
  for (const action of actions) {
    if (action.pinned) continue;
    const day = startOfDay(action.timestamp);
    const last = groups[groups.length - 1];
    if (last?.key === String(day)) {
      last.actions.push(action);
    } else {
      groups.push({ key: String(day), label: labels.day(day), actions: [action] });
    }
  }
  return groups;
};
