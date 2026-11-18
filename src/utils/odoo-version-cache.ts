export const MAX_ODOO_VERSIONS = 200;
export const ODOO_VERSION_TTL_MS = 30 * 60 * 1000;

/** `text` is the badge text, or null when the origin gave no version. */
export interface OdooVersionEntry {
  origin: string;
  text: string | null;
  checkedAt: number;
}

export const findFreshVersion = (
  entries: OdooVersionEntry[],
  origin: string,
  now: number,
): OdooVersionEntry | undefined =>
  entries.find((entry) => entry.origin === origin && now - entry.checkedAt < ODOO_VERSION_TTL_MS);

export const recordVersion = (
  entries: OdooVersionEntry[],
  entry: OdooVersionEntry,
): OdooVersionEntry[] =>
  [entry, ...entries.filter(({ origin }) => origin !== entry.origin)].slice(0, MAX_ODOO_VERSIONS);
