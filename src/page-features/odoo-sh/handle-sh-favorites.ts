import { favoritesService } from "@/services/favorites-service";
import { Favorite } from "@/types";
import { NON_STARRED_CLASS, STARRED_CLASS } from "@/utils/constants";
import { t } from "@/utils/i18n-page";

function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

const addFavorite = (projectName: string) => favoritesService.addToFavorites(projectName);

const removeFavorite = (projectName: string) => favoritesService.deleteFromFavorites(projectName);

const extractProjectName = (element: Element): string =>
  element.querySelector("span:nth-child(2), td:nth-child(2)")?.textContent?.trim() || "";

const renameProjectName = (favoriteName: string, element: HTMLElement) => {
  element.innerText = favoriteName;
};

/**
 * Generates a favorite element (star icon) for a project in either card or list view.
 * This function creates a star icon that users can click to mark a project as a favorite.
 * The appearance of the star (filled or outlined) is determined by whether the project is already marked as a favorite.
 * The function supports generating the star icon for two types of views: card and list.
 *
 * @param {"card" | "list"} type - Specifies the type of view where the star icon will be used. Can be 'card' for project cards or 'list' for list view.
 * @param {boolean} [isStarred=false] - Indicates whether the project is currently marked as a favorite. Defaults to false, meaning the project is not a favorite.
 * @returns {HTMLElement} The star icon element, ready to be inserted into the DOM. The element is a <div> for card view and an <i> for list view.
 */
const generateFavoriteElement = (
  type: "card" | "list",
  isStarred: boolean = false,
): HTMLElement => {
  const currentClass = isStarred ? STARRED_CLASS : NON_STARRED_CLASS;
  if (type === "card") {
    const star = document.createElement("div");
    star.innerHTML = `<i class="fa ${currentClass}" aria-hidden="true"></i>`;
    star.className = "x-odoo-sh-favorite-icon p-2";
    star.title = t("page_features.sh_favorites.star_hint");
    return star;
  }

  const star = document.createElement("i");
  star.classList.add("fa", currentClass, "pr-2", "x-odoo-sh-favorite-icon-list");
  star.ariaHidden = "true";
  star.title = t("page_features.sh_favorites.star_hint");
  return star;
};

/**
 * Sorts two project elements based on their favorite status, sequence and names.
 * This function sorts project elements first by whether they are marked as favorites (projects with
 * a star icon are considered favorites). Favorites are then ordered by their user defined
 * `sequence`, falling back to alphabetical order when two favorites share the same sequence.
 * Non-favorite projects are sorted alphabetically.
 *
 * @param {Element} a - The first project element to compare.
 * @param {Element} b - The second project element to compare.
 * @returns {number} A negative value if `a` should come before `b`, a positive value if `a` should come after `b`, or 0 if they are considered equal in the sort order.
 */
const sortProjects = (a: Element, b: Element): number => {
  const aEl = a as HTMLElement;
  const bEl = b as HTMLElement;
  const aHasStar = a.querySelector(".fa-star") !== null;
  const bHasStar = b.querySelector(".fa-star") !== null;

  // Both favorites
  if (aHasStar && bHasStar) {
    const aSeq = Number(aEl.dataset.odooShFavoriteSequence);
    const bSeq = Number(bEl.dataset.odooShFavoriteSequence);
    // Fall back to a large value when the sequence is missing
    const aSeqValue = Number.isNaN(aSeq) ? Number.POSITIVE_INFINITY : aSeq;
    const bSeqValue = Number.isNaN(bSeq) ? Number.POSITIVE_INFINITY : bSeq;
    if (aSeqValue !== bSeqValue) return aSeqValue - bSeqValue;
  }

  if (aHasStar === bHasStar) {
    const aName = aEl.dataset.name;
    const bName = bEl.dataset.name;
    if (aName && bName) return aName.localeCompare(bName);
  }
  return Number(bHasStar) - Number(aHasStar);
};

/**
 * Toggles the favorite status of a project by updating the star icon appearance and modifying the favorites list.
 * This function checks if the project is currently marked as a favorite (starred). If it is, the function removes
 * the favorite status, updates the star icons to reflect this change, and removes the project from the favorites list.
 * If the project is not currently a favorite, the function adds the favorite status, updates the star icons to indicate
 * the project is now a favorite, and adds the project to the favorites list.
 *
 * @param {HTMLElement[]} stars - An array of HTMLElements representing the star icons associated with the project.
 *                                These elements will have their classes updated to reflect the project's favorite status.
 * @param {string} projectName - The name of the project for which the favorite status is being toggled.
 * @returns {Promise<void>} A promise that resolves when the favorite status has been successfully toggled and the favorites list updated.
 */
const toggleStar = (stars: HTMLElement[], projectName: string): Promise<void> => {
  const isStarred = stars[0].classList.contains(STARRED_CLASS);
  if (isStarred) {
    stars.forEach((star) => {
      star.classList.remove(STARRED_CLASS);
      star.classList.add(NON_STARRED_CLASS);
    });
    return removeFavorite(projectName);
  } else {
    stars.forEach((star) => {
      star.classList.remove(NON_STARRED_CLASS);
      star.classList.add(STARRED_CLASS);
    });
    return addFavorite(projectName);
  }
};

/**
 * Handles the click event on a favorite star icon, toggling the favorite status of a project.
 *
 * @param {Event} event - The click event triggered by clicking on a favorite star icon.
 * @param {string} projectName - The name of the project associated with the clicked star icon.
 * @returns {Promise<void>} A promise that resolves once the favorite status has been toggled and the UI updated.
 */
const handleFavoriteClick = async (event: Event, projectName: string): Promise<void> => {
  const starContainer = event.currentTarget as HTMLElement;
  // For the kanban view the listener is attached to a wrapping div that holds the inner <i>, so
  // resolve it to the icon that carries the favorite class.
  const star = starContainer.querySelector("i") || starContainer;

  await toggleStar([star], projectName);

  // Re-sort the currently rendered view after toggling the favorite status.
  const projectsCards = document.querySelectorAll("div.o_project_card_container");
  if (projectsCards.length > 0) {
    const projectsContainer = document.querySelector(".o_project_cards");
    Array.from(projectsCards)
      .toSorted(sortProjects)
      .forEach((element) => projectsContainer?.appendChild(element));
  }
  const projectsList = document.querySelectorAll("tr.o_project_card_container");
  if (projectsList.length > 0) {
    const projectsContainer = document.querySelector(".o_project_cards");
    const tableBody = projectsContainer?.querySelector("div.o_sh_display_list > table > tbody");
    Array.from(projectsList)
      .toSorted(sortProjects)
      .forEach((element) => tableBody?.appendChild(element));
  }
};

/**
 * Updates the search bar on the project list page to filter projects based on user input
 * and take the custom project name into account.
 *
 * This function modifies the search bar's class name to a custom one to ignore the default search
 * and adds a custom event listener, close to the default one.
 *
 * Since this is called again on each DOM mutation, the previously attached listeners are removed
 * (if any) before re-adding them, so handlers never accumulate and a missing search bar at the
 * first call can simply be retried later.
 */
let configuredSearchInput: HTMLInputElement | null = null;

const updateSearchBar = () => {
  const projectsSearchBar = document.querySelector(".o_sh_projects_search");
  const projectsSearchBarInput = projectsSearchBar?.querySelector("input") ?? null;

  if (!projectsSearchBar || !projectsSearchBarInput) return;

  if (configuredSearchInput === projectsSearchBarInput) return;

  // Clone the input to attach our custom listener
  const input = projectsSearchBarInput.cloneNode(true) as HTMLInputElement;
  projectsSearchBarInput.replaceWith(input);
  configuredSearchInput = input;

  const handleSearchInput = debounce((event: InputEvent) => {
    const searchQuery = (event.target as HTMLInputElement).value.toLowerCase();
    const cards = Array.from(document.querySelectorAll<HTMLElement>(".o_project_card_container"));
    for (const card of cards) {
      card.classList.remove("d-none");
      const projectDefaultName = (card.dataset.name || "").toLowerCase();
      const projectNameElement = card.querySelector(
        ".x-odoo-sh-project-name",
      ) as HTMLElement | null;
      const projectName = (projectNameElement?.textContent || "").toLowerCase();

      if (
        searchQuery &&
        !projectDefaultName.includes(searchQuery) &&
        !projectName.includes(searchQuery)
      ) {
        card.classList.add("d-none");
      }
    }
  }, 350);

  const handleSearchKeydown = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      const visibleCards = Array.from(
        document.querySelectorAll<HTMLElement>(".o_project_card_container"),
      ).filter((card) => !card.classList.contains("d-none"));
      if (visibleCards.length === 1) {
        const cardElement = visibleCards[0];
        const linkElement = Array.from(cardElement.querySelectorAll("a")).find(
          (a) => a.getAttribute("href")?.startsWith("/project/") && a.textContent?.includes("Open"),
        );
        linkElement?.click();
      }
    }
  };

  input.addEventListener("input", handleSearchInput);
  input.addEventListener("keydown", handleSearchKeydown);
};

/**
 * Handles the initialization and dynamic updates of the project list page.
 * This is responsible for:
 * - Observing the DOM for newly added project cards or list items.
 * - Retrieving the list of favorite projects from storage.
 * - Adding a favorite star icon to each kanban card and each list row (skipping nodes that already
 *   have one), storing the original name in the dataset so it can be matched later.
 * - Renaming favorited projects with their display name and keeping the favorite sequence.
 * - Sorting the projects of the rendered view based on their favorite status, sequence and names.
 *
 * This ensures that the project list page dynamically reflects the current favorite status of
 * projects and allows users to easily toggle this status, even when the content is loaded
 * asynchronously.
 *
 * @async
 * @returns {Promise<() => void>} A promise that resolves to a teardown function which disconnects
 * the observer (used when navigating away from this page in the SPA).
 */
const handleProjectListPageFavorites = async (): Promise<() => void> => {
  const wrapper = document.querySelector(".odoo_sh_app_body") ?? document.body;
  const favorites = await favoritesService.getFavoritesProjects();

  const processProjectKanban = () => {
    const projectsCards = Array.from(
      document.querySelectorAll<HTMLElement>("div.o_project_card_container"),
    );
    if (projectsCards.length === 0) return;

    const projectsContainer = document.querySelector(".o_project_cards");

    const unprocessedCards = projectsCards.filter(
      (card) => !card.querySelector(".x-odoo-sh-favorite-icon"),
    );
    if (unprocessedCards.length === 0) return;

    for (const projectCard of unprocessedCards) {
      const projectName = projectCard.querySelector("a")?.textContent?.trim() as string;
      projectCard.dataset.name = projectName;
      const buttonsRow = projectCard.querySelector("div.card > div > div");
      if (buttonsRow) {
        buttonsRow.classList.add("x-odoo-sh-fix-card-buttons-row"); // Attempt to fix misalignement
        const dropdown = buttonsRow.querySelector(".o_project_dropdown");
        dropdown?.classList.remove("p-2");
        dropdown?.classList.add("x-odoo-sh-fix-card-dropdown");
        const currentFavorite = favorites.find((favorite) => favorite.name === projectName);
        const star = generateFavoriteElement("card", currentFavorite !== undefined);
        buttonsRow.appendChild(star);

        const projectCardTopBar = buttonsRow.parentElement;
        const projectLinkNameTopBar = projectCardTopBar?.querySelector("a");
        if (projectLinkNameTopBar) {
          projectLinkNameTopBar.classList.add("x-odoo-sh-project-name");
          if (currentFavorite) {
            renameProjectName(currentFavorite.display_name, projectLinkNameTopBar);
            projectCard.dataset.odooShDisplayName = currentFavorite.display_name;
            projectCard.dataset.odooShFavoriteSequence = String(currentFavorite.sequence);
          }
        }

        star.addEventListener("click", (event) => handleFavoriteClick(event, projectName));
      }
    }
    projectsCards
      .toSorted(sortProjects)
      .forEach((element) => projectsContainer?.appendChild(element));
  };

  const processProjectList = () => {
    const projectsList = Array.from(
      document.querySelectorAll<HTMLElement>("tr.o_project_card_container"),
    );
    if (projectsList.length === 0) return;

    const projectsContainer = document.querySelector(".o_project_cards");
    const tableBody = projectsContainer?.querySelector("div.o_sh_display_list > table > tbody");

    const unprocessedRows = projectsList.filter(
      (row) => !row.querySelector(".x-odoo-sh-favorite-icon-list"),
    );
    if (unprocessedRows.length === 0) return;

    for (const projectRow of unprocessedRows) {
      const nameCell = projectRow.querySelector("th");
      const projectName = nameCell?.textContent?.trim() as string;
      projectRow.dataset.name = projectName;

      const currentFavorite = favorites.find((favorite: Favorite) => favorite.name === projectName);
      if (nameCell) {
        const star = generateFavoriteElement("list", currentFavorite !== undefined);
        nameCell.classList.add("x-odoo-sh-project-name");

        if (currentFavorite) {
          renameProjectName(currentFavorite.display_name, nameCell);
          projectRow.dataset.odooShDisplayName = currentFavorite.display_name;
          projectRow.dataset.odooShFavoriteSequence = String(currentFavorite.sequence);
        }

        nameCell.prepend(star);

        star.addEventListener("click", (event) => handleFavoriteClick(event, projectName));
      }
    }
    projectsList.toSorted(sortProjects).forEach((element) => tableBody?.appendChild(element));
  };

  const processProjects = () => {
    const projectsView = document.querySelector(".o_project_cards");
    if (!projectsView) return;

    updateSearchBar();
    processProjectKanban();
    processProjectList();
  };

  processProjects();

  const observer = new MutationObserver((mutations) => {
    const hasAddedProjectNode = mutations.some(
      (mutation) =>
        mutation.type === "childList" &&
        Array.from(mutation.addedNodes).some(
          (node) =>
            node instanceof Element &&
            (node.classList.contains("o_project_card_container") ||
              node.classList.contains("o_project_cards")),
        ),
    );
    if (hasAddedProjectNode) processProjects();
  });

  observer.observe(wrapper, {
    childList: true,
    subtree: true,
  });

  return () => observer.disconnect();
};

/**
 * Updates the project list by sorting projects based on their favorite status and adding a star icon to favorite projects.
 *
 * @param {string[]} favorites - An array of favorite project names.
 */
const updateProjectList = (favorites: Favorite[]): void => {
  const projectMenu = document.querySelector("div.project-menu") as HTMLElement;
  const scrollableMenu = projectMenu.querySelector(".scrollable-menu");
  const projects = Array.from(projectMenu.querySelectorAll<HTMLElement>("a.d-contents.text-body"));

  if (projects.length === 0) return;

  const projectNames = new Map(projects.map((p) => [p, extractProjectName(p)]));

  // Favorites first, ordered by their stored sequence (tiebreak by name)
  const getFavorite = (project: HTMLElement) =>
    favorites.find((fav) => fav.name === projectNames.get(project));

  const sortedProjects = projects.toSorted((a, b) => {
    const aFavorite = getFavorite(a);
    const bFavorite = getFavorite(b);
    if (aFavorite && bFavorite) {
      if (aFavorite.sequence !== bFavorite.sequence) return aFavorite.sequence - bFavorite.sequence;
      return aFavorite.name.localeCompare(bFavorite.name);
    }
    return aFavorite ? -1 : bFavorite ? 1 : 0;
  });

  for (const project of sortedProjects) {
    const favorite = getFavorite(project);
    if (!favorite) continue;

    // The first cell is where Odoo marks favorites. Convert its check into a filled star, or add one
    const indicator = project.children[0] as HTMLElement | undefined;
    if (indicator && !indicator.querySelector(".fa-star")) {
      const existingCheck = indicator.querySelector(".fa-check");
      if (existingCheck) {
        existingCheck.classList.remove("fa-check");
        existingCheck.classList.add("fa-star", "me-auto", "ms-auto");
      } else {
        const star = document.createElement("i");
        star.className = "fa fa-star text-warning me-auto ms-auto";
        indicator.prepend(star);
      }
    }

    const nameCell = project.children[1] as HTMLElement | undefined;
    if (nameCell) nameCell.textContent = favorite.display_name;
  }

  scrollableMenu?.append(...sortedProjects);
};

export { handleProjectListPageFavorites, updateProjectList };
