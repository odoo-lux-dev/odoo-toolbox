import {
  addCopyIconToBranchTitle,
  addCopyIconToBranchTitleBuildPage,
} from "@/page-features/odoo-sh/handle-sh-branch-name-copy";
import { updateProjectList } from "@/page-features/odoo-sh/handle-sh-project-menu";
import {
  addProjectTaskLinkBranchTitle,
  addProjectTaskLinkBranchTitleBuildPage,
} from "@/page-features/odoo-sh/handle-sh-project-task-link";
import { renameShProjectPageTitle } from "@/page-features/odoo-sh/handle-sh-rename-project-page";
import { favoritesService } from "@/services/favorites-service";
import { settingsService } from "@/services/settings-service";

const REGEX_CURRENT_PROJECT_NAME = /\/project\/(?<project_name>[^/?#&=;]+)/;
const COLORBLIND_CLASS = "x-odoo-options-colorblind-mode";

/**
 * Enhances an Odoo.sh project page as the SPA renders it: favorites in the project menu,
 * branch name copy and task links on the branch and builds views, colorblind palette and
 * page title.
 *
 * @returns A teardown function disconnecting the observer (SPA navigation).
 */
const handleProjectPage = async (): Promise<() => void> => {
  const wrapper = document.querySelector(".odoo_sh_app_body");
  if (!wrapper) return () => {};
  const favorites = await favoritesService.get();
  const {
    renameShProjectPage,
    taskUrl: globalTaskUrl,
    colorBlindMode,
  } = await settingsService.getSettings();

  const getCurrentProject = () => {
    const name = window.location.href.match(REGEX_CURRENT_PROJECT_NAME)?.groups?.project_name;
    const favorite = name ? favorites.find((fav) => fav.name === name) : undefined;
    return { name, favorite, taskUrl: favorite?.task_link || globalTaskUrl };
  };

  const handleAddedElement = (element: Element) => {
    const { taskUrl } = getCurrentProject();
    const { classList } = element;
    if (classList.contains("project-menu")) {
      updateProjectList(favorites);
    } else if (classList.contains("o_branch_header")) {
      addCopyIconToBranchTitle();
      addProjectTaskLinkBranchTitle(taskUrl);
    } else if (classList.contains("o_branches_view")) {
      if (colorBlindMode) {
        element.querySelector(".o_branches_listing")?.classList.add(COLORBLIND_CLASS);
      }
    } else if (classList.contains("o_builds_view")) {
      if (colorBlindMode) classList.add(COLORBLIND_CLASS);
      for (const buildLine of element.querySelectorAll(".o_builds_branch")) {
        addCopyIconToBranchTitleBuildPage(buildLine);
        addProjectTaskLinkBranchTitleBuildPage(buildLine, taskUrl);
      }
    }
  };

  const observer = new MutationObserver((mutations) => {
    if (renameShProjectPage) {
      const { name, favorite } = getCurrentProject();
      renameShProjectPageTitle(favorite?.display_name || name || "", name || "");
    }
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeName === "DIV") handleAddedElement(node as Element);
      }
    }
  });

  observer.observe(wrapper, {
    attributes: true,
    childList: true,
    subtree: true,
  });

  return () => observer.disconnect();
};

export { handleProjectPage };
