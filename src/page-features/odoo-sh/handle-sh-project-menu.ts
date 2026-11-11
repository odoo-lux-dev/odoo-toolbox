import { bindProjectSearch } from "@/page-features/odoo-sh/project-search";
import { compareProjects, STARRED_CLASS } from "@/page-features/odoo-sh/project-sort";
import type { Favorite } from "@/types";
import { t } from "@/utils/i18n-page";

/**
 * Adds a search input at the top of the project dropdown menu, matching both the display
 * name and the original Odoo name (stored in the dataset).
 */
const setupProjectMenuSearch = (projectMenu: HTMLElement): void => {
  const scrollableMenu = projectMenu.querySelector<HTMLElement>(".scrollable-menu");
  if (!scrollableMenu || projectMenu.querySelector(".x-odoo-project-menu-search")) return;

  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.className = "form-control form-control-sm x-odoo-project-menu-search";
  searchInput.placeholder = t("page_features.sh_favorites.search_placeholder");

  bindProjectSearch(searchInput, {
    items: () => [...scrollableMenu.querySelectorAll<HTMLElement>("a.d-contents.text-body")],
    names: (project) => [project.dataset.odooShOriginalName, project.textContent],
    setVisible: (project, visible) =>
      project.style.setProperty("display", visible ? "" : "none", "important"),
    open: (project) => project.click(),
    delay: 150,
  });

  scrollableMenu.before(searchInput);
  searchInput.focus();
};

/**
 * Sorts the projects of the project dropdown menu (favorites first), shows the favorites'
 * display names and a star, and adds a search input.
 */
export const updateProjectList = (favorites: Favorite[]): void => {
  const projectMenu = document.querySelector<HTMLElement>("div.project-menu");
  if (!projectMenu) return;
  const projects = Array.from(projectMenu.querySelectorAll<HTMLElement>("a.d-contents.text-body"));
  if (projects.length === 0) return;

  const entries = projects.map((element) => {
    const name =
      element.querySelector("span:nth-child(2), td:nth-child(2)")?.textContent?.trim() || "";
    const favorite = favorites.find((fav) => fav.name === name);
    // An empty name keeps the non-favorites in Odoo's order (stable sort).
    const key = {
      starred: !!favorite,
      sequence: favorite?.sequence ?? 0,
      name: favorite ? name : "",
    };
    return { element, name, favorite, key };
  });
  const sorted = entries.toSorted((a, b) => compareProjects(a.key, b.key));

  for (const { element, name, favorite } of sorted) {
    element.dataset.odooShOriginalName = name;
    if (!favorite) continue;

    // Odoo marks its own favorites with a check in the first cell: show a star instead.
    const indicator = element.children[0] as HTMLElement | undefined;
    if (indicator && !indicator.querySelector(`.${STARRED_CLASS}`)) {
      const existingCheck = indicator.querySelector(".fa-check");
      if (existingCheck) {
        existingCheck.classList.replace("fa-check", STARRED_CLASS);
        existingCheck.classList.add("me-auto", "ms-auto");
      } else {
        const star = document.createElement("i");
        star.className = `fa ${STARRED_CLASS} text-warning me-auto ms-auto`;
        indicator.prepend(star);
      }
    }

    const nameCell = element.children[1] as HTMLElement | undefined;
    if (nameCell) nameCell.textContent = favorite.display_name;
  }

  projectMenu.querySelector(".scrollable-menu")?.append(...sorted.map(({ element }) => element));

  setupProjectMenuSearch(projectMenu);
};
