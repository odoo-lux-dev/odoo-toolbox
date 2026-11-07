import { favoritesService } from "@/services/favorites-service";
import type { Favorite } from "@/types";
import { t } from "@/utils/i18n-page";

// Font Awesome star icons of the Odoo.sh project list.
const STARRED_CLASS = "fa-star";
const NON_STARRED_CLASS = "fa-star-o";

const debounce = <A extends unknown[]>(fn: (...args: A) => void, delay: number) => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const debounced = (...args: A) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
  debounced.cancel = () => clearTimeout(timer);
  return debounced;
};

interface ProjectSortKey {
  starred: boolean;
  sequence: number;
  name: string;
}

/** Favorites first, ordered by their sequence, then by name. */
const compareProjects = (a: ProjectSortKey, b: ProjectSortKey): number => {
  if (a.starred !== b.starred) return Number(b.starred) - Number(a.starred);
  if (a.starred && a.sequence !== b.sequence) return a.sequence - b.sequence;
  return a.name.localeCompare(b.name);
};

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

interface ProjectSearch {
  items: () => HTMLElement[];
  /** Names an item matches on: its Odoo name and its favorite display name. */
  names: (item: HTMLElement) => (string | null | undefined)[];
  setVisible: (item: HTMLElement, visible: boolean) => void;
  open: (item: HTMLElement) => void;
  delay: number;
}

/** Filters the projects as the user types in `input`; Enter opens the only match. */
const bindProjectSearch = (input: HTMLInputElement, search: ProjectSearch): (() => void) => {
  const matches = (item: HTMLElement) => {
    const query = input.value.trim().toLowerCase();
    return !query || search.names(item).some((name) => name?.toLowerCase().includes(query));
  };
  const apply = () => {
    for (const item of search.items()) search.setVisible(item, matches(item));
  };
  const applyDebounced = debounce(apply, search.delay);

  input.addEventListener("input", applyDebounced);
  input.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    applyDebounced.cancel();
    apply();
    const visible = search.items().filter(matches);
    if (visible.length !== 1) return;
    event.preventDefault();
    search.open(visible[0]);
  });
  return applyDebounced.cancel;
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
const handleProjectListPageFavorites = async (): Promise<() => void> => {
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
const updateProjectList = (favorites: Favorite[]): void => {
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

export { handleProjectListPageFavorites, updateProjectList };
