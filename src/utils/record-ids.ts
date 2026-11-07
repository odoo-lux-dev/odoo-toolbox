const parseJsonArray = (text: string): unknown[] => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new Error(`Invalid IDs format: ${error instanceof Error ? error.message : error}`);
  }
  if (!Array.isArray(parsed)) throw new Error(`Invalid IDs format: ${text}`);
  return parsed;
};

/** Parses record ids: a comma separated list or a JSON array of ids. Throws on an invalid id. */
export const parseIds = (input: string): number[] => {
  const text = input.trim();
  if (!text) return [];
  const parts = text.startsWith("[") ? parseJsonArray(text) : text.split(",");
  return parts.map((part) => {
    const id = String(part).trim();
    if (!/^\d+$/.test(id)) throw new Error(`Invalid ID: ${id}`);
    return Number(id);
  });
};

export const areValidIds = (input: string): boolean => {
  try {
    parseIds(input);
    return true;
  } catch {
    return false;
  }
};

/** Ids of records as the record ids input shows them. */
export const formatIds = (records: Record<string, unknown>[]): string =>
  records.map((record) => record.id).join(", ");
