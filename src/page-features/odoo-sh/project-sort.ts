// Font Awesome star icons of the Odoo.sh project list.
export const STARRED_CLASS = "fa-star";
export const NON_STARRED_CLASS = "fa-star-o";

export interface ProjectSortKey {
  starred: boolean;
  sequence: number;
  name: string;
}

/** Favorites first, ordered by their sequence, then by name. */
export const compareProjects = (a: ProjectSortKey, b: ProjectSortKey): number => {
  if (a.starred !== b.starred) return Number(b.starred) - Number(a.starred);
  if (a.starred && a.sequence !== b.sequence) return a.sequence - b.sequence;
  return a.name.localeCompare(b.name);
};
