type Direction = "ASC" | "DESC";

/** `"name asc, id desc"` ↔ `["name ASC", "id DESC"]` (the select values). */
export const parseOrderBy = (orderBy: string): string[] =>
  orderBy
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [field, direction] = part.split(/\s+/);
      return `${field} ${direction?.toUpperCase() === "DESC" ? "DESC" : "ASC"}`;
    });

export const formatOrderBy = (values: string[]): string =>
  values
    .map((value) =>
      value.replace(/\s+(ASC|DESC)$/, (_, direction: Direction) => ` ${direction.toLowerCase()}`),
    )
    .join(", ");
