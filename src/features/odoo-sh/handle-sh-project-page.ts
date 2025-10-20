import {
    addCopyIconToBranchTitle,
    addCopyIconToBranchTitleBuildPage,
} from "@/features/odoo-sh/handle-sh-branch-name-copy";
import { addColorBlindClass } from "@/features/odoo-sh/handle-sh-colorblind-mode";
import { updateProjectList } from "@/features/odoo-sh/handle-sh-favorites";
import { addGithubIconToBranchTitle } from "@/features/odoo-sh/handle-sh-github-link";
import {
    addProjectTaskLinkBranchTitle,
    addProjectTaskLinkBranchTitleBuildPage,
} from "@/features/odoo-sh/handle-sh-project-task-link";
import { renameShProjectPageTitle } from "@/features/odoo-sh/handle-sh-rename-project-page";
import { favoritesService } from "@/services/favorites-service";
import { settingsService } from "@/services/settings-service";

const REGEX_CURRENT_PROJECT_NAME = /\/project\/(?<project_name>[^/?#&=;]+)/;

/**
 * Monitors the project page for changes and dynamically updates the project list based on favorite status.
 * This function targets a specific element identified by the \#wrapwrap selector and sets up a MutationObserver
 * to listen for changes in the DOM. When a new header node is added to the DOM, it implies that the project list
 * might have been updated. The function then retrieves the current list of favorite projects and sorts the projects
 * displayed in the "table tbody" within the "div.project-menu" based on whether they are marked as favorites.
 * Projects marked as favorites are given priority in the list. Additionally, if a project is a favorite but does not
 * have a star icon, a star icon is added to signify its favorite status. This dynamic update ensures that the project
 * list reflects the current favorite status of projects, enhancing user experience by allowing for easy identification
 * of favorite projects. Furthermore, it adds a copy icon to the branch title element, allowing users to copy the branch
 * name to the clipboard.
 *
 * @async
 * @returns {Promise<void>} A promise that resolves once the observer has been set up and is monitoring for changes.
 */
const handleProjectPage = async (): Promise<void> => {
    const wrapper = document.querySelector("#wrapwrap");
    if (!wrapper) return;
    const favorites = await favoritesService.getFavoritesProjects();
    const {
        renameShProjectPage,
        taskUrl: globalTaskUrl,
        colorBlindMode,
    } = await settingsService.getSettings();

    let favoritesDone = false;
    const currentProjectName = window.location.href.match(
        REGEX_CURRENT_PROJECT_NAME,
    )?.groups?.project_name;
    const currentFavoriteProject =
        currentProjectName !== undefined
            ? favorites.find((favorite) => favorite.name === currentProjectName)
            : currentProjectName;

    const observer = new MutationObserver((mutations) => {
        if (renameShProjectPage)
            renameShProjectPageTitle(
                currentFavoriteProject?.display_name ||
                    currentProjectName ||
                    "",
                currentProjectName || "",
            );
        mutations.forEach((mutation) => {
            if (mutation.type === "childList") {
                for (const node of mutation.addedNodes) {
                    if (node.nodeName === "HEADER" && !favoritesDone) {
                        updateProjectList(favorites);
                        favoritesDone = true;
                    } else if (
                        node.nodeName === "DIV" &&
                        // @ts-expect-error - TS doesn't recognize classList
                        node.classList.contains("o_sh_panel_right")
                    ) {
                        addCopyIconToBranchTitle();
                        addGithubIconToBranchTitle();
                        addProjectTaskLinkBranchTitle(
                            currentFavoriteProject?.task_link || globalTaskUrl,
                        );
                    } else if (
                        node.nodeName === "DIV" &&
                        (node as Element).classList.contains(
                            "o_branches_listing",
                        )
                    ) {
                        if (colorBlindMode) {
                            addColorBlindClass(node);
                        }
                    } else if (
                        node.nodeName === "DIV" &&
                        // @ts-expect-error - TS doesn't recognize classList
                        node.classList.contains("o_builds_view")
                    ) {
                        if (colorBlindMode) {
                            addColorBlindClass(node);
                        }
                        const buildLines = (node as Element).querySelectorAll(
                            ".o_builds_branch",
                        );
                        if (!buildLines.length) return;
                        for (const buildLine of buildLines) {
                            addCopyIconToBranchTitleBuildPage(
                                buildLine as HTMLDivElement,
                            );
                            addProjectTaskLinkBranchTitleBuildPage(
                                buildLine as HTMLDivElement,
                                currentFavoriteProject?.task_link ||
                                    globalTaskUrl,
                            );
                        }
                    }
                }
            }
        });
    });

    observer.observe(wrapper, {
        attributes: true,
        childList: true,
        subtree: true,
    });
};

export { handleProjectPage };
