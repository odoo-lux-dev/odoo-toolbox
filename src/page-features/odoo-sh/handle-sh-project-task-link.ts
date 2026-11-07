import { t } from "@/utils/i18n-page";

import { extractTaskId, getBuildLineParts, getCurrentBranchName } from "./branch";

/**
 * Builds a link to the task referenced by `branchName`, or null when the branch name
 * has no task id. `projectUrl` contains a `{{task_id}}` placeholder.
 */
const createTaskLink = async (
  branchName: string,
  projectUrl: string,
): Promise<HTMLAnchorElement | null> => {
  const taskId = await extractTaskId(branchName);
  if (!taskId) return null;

  const taskLink = document.createElement("a");
  taskLink.href = projectUrl.replace("{{task_id}}", taskId);
  taskLink.target = "_blank";
  const icon = document.createElement("i");
  icon.className = "fa fa-tag";
  taskLink.appendChild(icon);
  return taskLink;
};

const addProjectTaskLinkBranchTitle = async (projectUrl?: string): Promise<void> => {
  const navbarButtons = document.querySelector(
    "div.o_branch_main_content nav.navbar div.btn-group",
  );
  const branchName = getCurrentBranchName();
  const selector = ".x-odoo-sh-project-task-link";
  if (!navbarButtons || !projectUrl || !branchName || navbarButtons.querySelector(selector)) {
    return;
  }

  const taskLink = await createTaskLink(branchName, projectUrl);
  // Re-check after the await: another mutation may have added the link meanwhile.
  if (!taskLink || navbarButtons.querySelector(selector)) return;

  taskLink.title = t("page_features.sh_task_link.open_task");
  taskLink.className = "btn btn-light me-2 text-decoration-none x-odoo-sh-project-task-link";
  taskLink.prepend(t("page_features.sh_task_link.open_task_prefix"));
  navbarButtons.prepend(taskLink);
};

const addProjectTaskLinkBranchTitleBuildPage = async (
  buildLine: Element,
  projectUrl?: string,
): Promise<void> => {
  const { branchName, buttonsRow } = getBuildLineParts(buildLine);
  const selector = ".x-odoo-sh-project-task-build-link";
  if (!branchName || !buttonsRow || !projectUrl || buttonsRow.querySelector(selector)) return;

  const taskLink = await createTaskLink(branchName, projectUrl);
  if (!taskLink || buttonsRow.querySelector(selector)) return;

  taskLink.className = "btn btn-sm btn-light x-odoo-sh-project-task-build-link";
  buttonsRow.append(taskLink);
};

export { addProjectTaskLinkBranchTitle, addProjectTaskLinkBranchTitleBuildPage };
