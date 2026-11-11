import { bindProjectSearch } from "@/page-features/odoo-sh/project-search";
import {
  compareProjects,
  NON_STARRED_CLASS,
  STARRED_CLASS,
  type ProjectSortKey,
} from "@/page-features/odoo-sh/project-sort";
import { favoritesService } from "@/services/favorites-service";
import type { Favorite } from "@/types";
import { t } from "@/utils/i18n-page";

/** Sort key of a rendered project card / row; the star icon is the current favorite state. */
const getRenderedProjectSortKey = (element: HTMLElement): ProjectSortKey => {
  const sequence = Number(element.dataset.odooShFavoriteSequence);
  return {
    starred: element.querySelector(`.${STARRED_CLASS}`) !== null,
    sequence: Number.isNaN(sequence) ? Number.POSITIVE_INFINITY : sequence,
    name: element.dataset.name ?? "",
  };
};

const sortRenderedProjects = (projects: HTMLElement[], container: Element | null | undefined) => {
  projects
    .map((element) => ({ element, key: getRenderedProjectSortKey(element) }))
    .toSorted((a, b) => compareProjects(a.key, b.key))
    .forEach(({ element }) => container?.appendChild(element));
};

const PROJECT_VIEWS = {
  kanban: {
    projectSelector: "div.o_project_card_container",
    starClass: "x-odoo-sh-favorite-icon",
    getContainer: () => document.querySelector(".o_project_cards"),
  },
  list: {
    projectSelector: "tr.o_project_card_container",
    starClass: "x-odoo-sh-favorite-icon-list",
    getContainer: () =>
      document.querySelector(".o_project_cards div.o_sh_display_list > table > tbody"),
  },
} as const;

type ProjectView = keyof typeof PROJECT_VIEWS;

const getRenderedProjects = (view: ProjectView) =>
  Array.from(document.querySelectorAll<HTMLElement>(PROJECT_VIEWS[view].projectSelector));

const resortRenderedProjects = () => {
  for (const view of Object.keys(PROJECT_VIEWS) as ProjectView[]) {
    const projects = getRenderedProjects(view);
    if (projects.length > 0) sortRenderedProjects(projects, PROJECT_VIEWS[view].getContainer());
  }
};

const createStar = (view: ProjectView, isStarred: boolean): HTMLElement => {
  const icon = document.createElement("i");
  icon.classList.add("fa", isStarred ? STARRED_CLASS : NON_STARRED_CLASS);
  icon.ariaHidden = "true";

  if (view === "list") {
    icon.classList.add("pr-2", PROJECT_VIEWS.list.starClass);
    icon.title = t("page_features.sh_favorites.star_hint");
    return icon;
  }
  const star = document.createElement("div");
  star.className = `${PROJECT_VIEWS.kanban.starClass} p-2`;
  star.title = t("page_features.sh_favorites.star_hint");
  star.appendChild(icon);
  return star;
};

const handleFavoriteClick = async (event: Event, projectName: string): Promise<void> => {
  // The kanban star is a wrapping div: the favorite class is on its inner <i>.
  const container = event.currentTarget as HTMLElement;
  const icon = container.querySelector("i") || container;
  const wasStarred = icon.classList.contains(STARRED_CLASS);

  icon.classList.toggle(STARRED_CLASS, !wasStarred);
  icon.classList.toggle(NON_STARRED_CLASS, wasStarred);
  await (wasStarred
    ? favoritesService.deleteFromFavorites(projectName)
    : favoritesService.addToFavorites(projectName));

  resortRenderedProjects();
};

/**
 * Adds a star to the projects that have none yet, shows the favorites' display names and
 * sorts the view.
 *
 * - kanban: the star goes in the card's buttons row, the name is the card's top link;
 * - list: the star is prepended to the name cell (`th`).
 */
const decorateProjects = (view: ProjectView, favorites: Favorite[]) => {
  const projects = getRenderedProjects(view);
  const { starClass, getContainer } = PROJECT_VIEWS[view];
  const undecorated = projects.filter((project) => !project.querySelector(`.${starClass}`));
  if (undecorated.length === 0) return;

  for (const project of undecorated) {
    const nameElement =
      view === "kanban" ? project.querySelector("a") : project.querySelector("th");
    const projectName = nameElement?.textContent?.trim() ?? "";
    project.dataset.name = projectName;

    const starAnchor =
      view === "kanban" ? project.querySelector<HTMLElement>("div.card > div > div") : nameElement;
    if (!starAnchor) continue;

    const favorite = favorites.find((fav) => fav.name === projectName);
    const star = createStar(view, favorite !== undefined);
    star.addEventListener("click", (event) => handleFavoriteClick(event, projectName));

    let displayNameElement = nameElement;
    if (view === "kanban") {
      // Fixes the misalignment of the buttons row once the star is added.
      starAnchor.classList.add("x-odoo-sh-fix-card-buttons-row");
      const dropdown = starAnchor.querySelector(".o_project_dropdown");
      dropdown?.classList.remove("p-2");
      dropdown?.classList.add("x-odoo-sh-fix-card-dropdown");
      starAnchor.appendChild(star);
      displayNameElement = starAnchor.parentElement?.querySelector("a") ?? null;
    }

    if (displayNameElement) {
      displayNameElement.classList.add("x-odoo-sh-project-name");
      if (favorite) {
        displayNameElement.innerText = favorite.display_name;
        project.dataset.odooShDisplayName = favorite.display_name;
        project.dataset.odooShFavoriteSequence = String(favorite.sequence);
      }
    }

    if (view === "list") starAnchor.prepend(star);
  }
  sortRenderedProjects(projects, getContainer());
};

/**
 * Replaces the project search of the list page by one that also matches the favorites'
 * display names. The input is cloned to drop Odoo's own listeners; this runs again on
 * every DOM mutation and is a no-op once the current input is configured.
 */
const createSearchBarUpdater = () => {
  let configuredInput: HTMLInputElement | null = null;
  let dispose = () => {};

  const update = () => {
    const searchInput = document.querySelector<HTMLInputElement>(".o_sh_projects_search input");
    if (!searchInput || searchInput === configuredInput) return;

    const input = searchInput.cloneNode(true) as HTMLInputElement;
    searchInput.replaceWith(input);
    configuredInput = input;
    dispose();
    dispose = bindProjectSearch(input, {
      items: () => [...document.querySelectorAll<HTMLElement>(".o_project_card_container")],
      names: (card) => [
        card.dataset.name,
        card.querySelector(".x-odoo-sh-project-name")?.textContent,
      ],
      setVisible: (card, visible) => card.classList.toggle("d-none", !visible),
      open: (card) =>
        [...card.querySelectorAll("a")]
          .find(
            (a) =>
              a.getAttribute("href")?.startsWith("/project/") && a.textContent?.includes("Open"),
          )
          ?.click(),
      delay: 350,
    });
  };

  return { update, dispose: () => dispose() };
};

/**
 * Enhances the Odoo.sh project list page (kanban and list views): favorite stars, display
 * names, favorites-first sorting and a search matching the display names.
 *
 * @returns A teardown function disconnecting the observer (SPA navigation).
 */
export const handleProjectListPageFavorites = async (): Promise<() => void> => {
  const wrapper = document.querySelector(".odoo_sh_app_body") ?? document.body;
  const favorites = await favoritesService.get();
  const searchBar = createSearchBarUpdater();

  const processProjects = () => {
    if (!document.querySelector(".o_project_cards")) return;
    searchBar.update();
    decorateProjects("kanban", favorites);
    decorateProjects("list", favorites);
  };

  processProjects();

  const observer = new MutationObserver((mutations) => {
    const hasAddedProjectNode = mutations.some((mutation) =>
      Array.from(mutation.addedNodes).some(
        (node) =>
          node instanceof Element &&
          (node.classList.contains("o_project_card_container") ||
            node.classList.contains("o_project_cards")),
      ),
    );
    if (hasAddedProjectNode) processProjects();
  });

  observer.observe(wrapper, { childList: true, subtree: true });

  return () => {
    observer.disconnect();
    searchBar.dispose();
  };
};
