import { favoritesService } from "@/services/favorites-service"
import { Favorite } from "@/types"
import { NON_STARRED_CLASS, STARRED_CLASS } from "@/utils/constants"
import { simpleDebounce } from "@/utils/utils"

const addFavorite = (projectName: string) =>
    favoritesService.addToFavorites(projectName)

const removeFavorite = (projectName: string) =>
    favoritesService.deleteFromFavorites(projectName)

const extractProjectName = (element: Element): string =>
    element.getAttribute("onclick")?.match(/\/project\/([^']+)/)?.[1] || ""

const renameProjectName = (favoriteName: string, element: HTMLElement) => {
    element.innerText = favoriteName
}

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
    isStarred: boolean = false
): HTMLElement => {
    const currentClass = isStarred ? STARRED_CLASS : NON_STARRED_CLASS
    if (type === "card") {
        const star = document.createElement("div")
        star.innerHTML = `<i class="fa ${currentClass}" aria-hidden="true"></i>`
        star.className = "x-odoo-sh-favorite-icon p-2"
        star.title = "Click to star project"
        return star
    }

    const star = document.createElement("i")
    star.classList.add(
        "fa",
        currentClass,
        "pr-2",
        "x-odoo-sh-favorite-icon-list"
    )
    star.ariaHidden = "true"
    star.title = "Click to star project"
    return star
}

/**
 * Sorts two project elements based on their favorite status and names.
 * This function is designed to sort project elements first by whether they are marked as favorites (projects with a star icon are considered favorites)
 * and then alphabetically by their names if both projects have the same favorite status. Projects marked as favorites are prioritized in the sorting order.
 *
 * @param {Element} a - The first project element to compare.
 * @param {Element} b - The second project element to compare.
 * @returns {number} A negative value if `a` should come before `b`, a positive value if `a` should come after `b`, or 0 if they are considered equal in the sort order.
 */
const sortProjects = (a: Element, b: Element): number => {
    const aHasStar = a.querySelector(".fa-star") !== null
    const bHasStar = b.querySelector(".fa-star") !== null
    if (aHasStar === bHasStar) {
        const aName = (a as HTMLElement).dataset.name
        const bName = (b as HTMLElement).dataset.name
        if (aName && bName) return aName.localeCompare(bName)
    }
    return Number(bHasStar) - Number(aHasStar)
}

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
const toggleStar = (
    stars: HTMLElement[],
    projectName: string
): Promise<void> => {
    const isStarred = stars[0].classList.contains(STARRED_CLASS)
    if (isStarred) {
        stars.forEach((star) => {
            star.classList.remove(STARRED_CLASS)
            star.classList.add(NON_STARRED_CLASS)
        })
        return removeFavorite(projectName)
    } else {
        stars.forEach((star) => {
            star.classList.remove(NON_STARRED_CLASS)
            star.classList.add(STARRED_CLASS)
        })
        return addFavorite(projectName)
    }
}

/**
 * Handles the click event on a favorite star icon, toggling the favorite status of a project.
 * This function identifies the clicked star icon and its counterpart (in list or card view), toggles the favorite status for the project,
 * and then reorders the projects based on their updated favorite status. It supports both list and card views, ensuring that the UI reflects
 * the current favorite status across different views. After toggling the favorite status, it re-sorts the projects to maintain a consistent
 * order, prioritizing favorited projects.
 *
 * @param {Event} event - The click event triggered by clicking on a favorite star icon.
 * @param {string} projectName - The name of the project associated with the clicked star icon.
 * @returns {Promise<void>} A promise that resolves once the favorite status has been toggled and the UI updated.
 */
const handleFavoriteClick = async (
    event: Event,
    projectName: string
): Promise<void> => {
    const projectsContainer = document.querySelector(".o_project_cards")
    const tableBody = projectsContainer?.querySelector(
        "div.o_sh_display_list > table > tbody"
    )

    const starContainer = event.currentTarget as HTMLElement
    const star = starContainer.querySelector("i") || starContainer
    let otherStar: HTMLElement
    if (starContainer.nodeName === "I") {
        // Event comes from list view
        otherStar = document.querySelector(
            `div.o_project_card_container[data-name="${projectName}"] .x-odoo-sh-favorite-icon i`
        ) as HTMLElement
    } else {
        // Event comes from cards view
        otherStar = document.querySelector(
            `tr.o_project_card_container[data-name="${projectName}"] th i`
        ) as HTMLElement
    }

    await toggleStar([star, otherStar], projectName)
    const projectsCardsNodes = document.querySelectorAll(
        "div.o_project_card_container"
    )
    const projectsListNodes = document.querySelectorAll(
        "tr.o_project_card_container"
    )
    const projectsCards = Array.from(projectsCardsNodes)
    const projectsList = Array.from(projectsListNodes)
    projectsCards
        .toSorted(sortProjects)
        .forEach((element) => projectsContainer?.appendChild(element))
    projectsList
        .toSorted(sortProjects)
        .forEach((element_1) => tableBody?.appendChild(element_1))
}

/**
 * Updates the search bar on the project list page to filter projects based on user input
 * and take the custom project name into account.
 *
 * This function modifies the search bar's class name to a custom one to ignore the default search
 * and adds a custom event listener, close to the default one.
 */
const updateSearchBar = () => {
    const projectsSearchBar = document.querySelector(".o_sh_projects_search")
    const projectsSearchBarInput = projectsSearchBar?.querySelector("input")

    if (!projectsSearchBar || !projectsSearchBarInput) return

    // Replace the class name to ignore the default search
    projectsSearchBar.classList.replace(
        "o_sh_projects_search",
        "x-odoo-sh-projects-search"
    )

    projectsSearchBarInput.addEventListener(
        "input",
        simpleDebounce((event: InputEvent) => {
            const input = event.target as HTMLInputElement
            const searchQuery = input.value.toLowerCase()
            const cards = Array.from(
                document.querySelectorAll<HTMLElement>(
                    ".o_project_card_container"
                )
            )
            for (const card of cards) {
                card.classList.remove("d-none")
                const projectDefaultName = (
                    card.dataset.name || ""
                ).toLowerCase()
                const subscriptionCode = (
                    card.dataset.subscriptionCode || ""
                ).toLowerCase()
                const projectNameElement = card.querySelector(
                    ".x-odoo-sh-project-name"
                ) as HTMLElement | null
                const projectName = (
                    projectNameElement?.innerText || ""
                ).toLowerCase()

                if (
                    searchQuery &&
                    !projectDefaultName.includes(searchQuery) &&
                    !subscriptionCode.includes(searchQuery) &&
                    !projectName.includes(searchQuery)
                ) {
                    card.classList.add("d-none")
                }
            }
        }, 350)
    )

    projectsSearchBarInput.addEventListener(
        "keydown",
        (event: KeyboardEvent) => {
            if (event.key === "Enter") {
                const visibleCards = Array.from(
                    document.querySelectorAll<HTMLElement>(
                        ".o_project_card_container"
                    )
                ).filter((card) => !card.classList.contains("d-none"))
                /**
                 * Check if only one favorite matches the search and, if so, open it
                 *
                 * We check if the length of visibleCards is 2
                 * because there is one visible card in the card view
                 * and its corresponding row in the list view
                 */
                if (visibleCards.length === 2) {
                    const cardElement = visibleCards[0]
                    const linkElement = Array.from(
                        cardElement.querySelectorAll("a")
                    ).find(
                        (a) =>
                            a.getAttribute("href")?.startsWith("/project/") &&
                            a.textContent?.includes("Open")
                    )
                    linkElement?.click()
                }
            }
        }
    )
}

/**
 * Handles the initialization and dynamic updates of the project list page. This function is responsible for:
 * - Checking if there are any project cards or list items on the page. If none are found, the function exits.
 * - Retrieving the list of favorite projects from storage.
 * - Iterating over each project card and list item, adding a favorite star icon to each based on whether it is marked as a favorite.
 * - Attaching click event listeners to each star icon that toggle the favorite status of the project.
 * - Sorting both project cards and list items based on their favorite status and names, then appending them back to the DOM to reflect the updated order.
 *
 * This ensures that the project list page dynamically reflects the current favorite status of projects and allows users to easily toggle this status.
 *
 * @async
 * @returns {Promise<void>} A promise that resolves once the page has been successfully initialized and updated.
 */
const handleProjectListPageFavorites = async (): Promise<void> => {
    const projectsCardsNodes = document.querySelectorAll(
        "div.o_project_card_container"
    )
    const projectsListNodes = document.querySelectorAll(
        "tr.o_project_card_container"
    )

    if (projectsCardsNodes.length === 0 && projectsListNodes.length === 0) {
        return
    }

    updateSearchBar()

    const projectsCards = Array.from(projectsCardsNodes)
    const projectsList = Array.from(projectsListNodes)
    const projectsContainer = document.querySelector(".o_project_cards")
    const tableBody = projectsContainer?.querySelector(
        "div.o_sh_display_list > table > tbody"
    )
    const favorites = await favoritesService.getFavoritesProjects()

    // Add star to each cards
    for (const projectCard of projectsCards) {
        const projectName = (projectCard as HTMLElement).dataset.name as string
        const buttonsRow = projectCard.querySelector("div.card > div > div")

        if (buttonsRow) {
            buttonsRow.classList.add("x-odoo-sh-fix-card-buttons-row") // Attempt to fix misalignement
            const dropdown = buttonsRow.querySelector(".o_project_dropdown")
            dropdown?.classList.remove("p-2")
            dropdown?.classList.add("x-odoo-sh-fix-card-dropdown")
            const currentFavorite = favorites.find(
                (favorite) => favorite.name === projectName
            )
            const star = generateFavoriteElement(
                "card",
                currentFavorite !== undefined
            )
            buttonsRow.appendChild(star)

            const projectCardTopBar = buttonsRow.parentElement
            const projectLinkNameTopBar = projectCardTopBar?.querySelector("a")
            if (projectLinkNameTopBar) {
                projectLinkNameTopBar.classList.add("x-odoo-sh-project-name")
                if (currentFavorite) {
                    renameProjectName(
                        currentFavorite.display_name,
                        projectLinkNameTopBar
                    )
                }
            }

            star.addEventListener("click", (event) =>
                handleFavoriteClick(event, projectName)
            )
        }
    }
    projectsCards
        .toSorted(sortProjects)
        .forEach((element) => projectsContainer?.appendChild(element))

    for (const projectRow of projectsList) {
        const projectName = (projectRow as HTMLElement).dataset.name as string

        const nameCell = projectRow.querySelector("th")
        const currentFavorite = favorites.find(
            (favorite: Favorite) => favorite.name === projectName
        )
        if (nameCell) {
            const star = generateFavoriteElement(
                "list",
                currentFavorite !== undefined
            )
            nameCell.classList.add("x-odoo-sh-project-name")

            if (currentFavorite) {
                renameProjectName(currentFavorite.display_name, nameCell)
            }

            nameCell.prepend(star)

            star.addEventListener("click", (event) =>
                handleFavoriteClick(event, projectName)
            )
        }
    }
    projectsList
        .toSorted(sortProjects)
        .forEach((element) => tableBody?.appendChild(element))
}

/**
 * Updates the project list by sorting projects based on their favorite status and adding a star icon to favorite projects.
 *
 * @param {string[]} favorites - An array of favorite project names.
 */
const updateProjectList = (favorites: Favorite[]): void => {
    const projectMenu = document.querySelector(
        "div.project-menu"
    ) as HTMLElement
    const tableBody = projectMenu.querySelector("table tbody") as HTMLElement
    const projects = Array.from(tableBody.children)
    const sortedProjects = projects.toSorted((a, b) => {
        const aRealName = extractProjectName(a)
        const bRealName = extractProjectName(b)
        const aFavorite = favorites.find((fav) => aRealName === fav.name)
        const bFavorite = favorites.find((fav) => bRealName === fav.name)
        const aIsFavorite = aFavorite !== undefined
        const bIsFavorite = bFavorite !== undefined

        if (!aIsFavorite && !bIsFavorite) return 0

        const targettedChild = aIsFavorite ? a.children[0] : b.children[0]
        const parentTargettedChild = targettedChild.parentElement
        const tdProjectName = parentTargettedChild?.querySelectorAll("td")[1]
        const favoriteDisplayName = aIsFavorite
            ? aFavorite!.display_name
            : bFavorite!.display_name

        if (targettedChild.children.length === 0) {
            const star = document.createElement("i")
            star.className = "fa fa-star text-warning"
            targettedChild.append(star)

            if (tdProjectName)
                renameProjectName(favoriteDisplayName, tdProjectName)
        } else if (
            targettedChild.children.length === 1 &&
            !targettedChild.children[0].className.includes("fa-star")
        ) {
            targettedChild.children[0].classList.remove("fa-check")
            targettedChild.children[0].classList.add("fa-star")

            if (tdProjectName)
                renameProjectName(favoriteDisplayName, tdProjectName)
        }
        return Number(bIsFavorite) - Number(aIsFavorite)
    })
    tableBody.append(...sortedProjects)
}

export { handleProjectListPageFavorites, updateProjectList }
