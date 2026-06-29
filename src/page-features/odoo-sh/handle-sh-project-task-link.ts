import { t } from "@/utils/i18n-page";
import { parseTaskTitle, extractBranchFromGitClone } from "@/utils/regex";

const extractTaskId = async (branchName: string): Promise<string | null> => {
  const match = await parseTaskTitle(branchName);
  return match ? match[1] : null;
};

const addProjectTaskLinkBranchTitle = async (projectUrl?: string): Promise<void> => {
  const branchTitle = document.querySelector("div.o_branch_main_content nav.navbar div.btn-group");
  const branchGithubCommand = document.querySelector("input.js_git_command") as HTMLInputElement;
  const branchName = extractBranchFromGitClone(branchGithubCommand?.value || "");

  if (
    !branchTitle ||
    branchTitle.querySelector(".x-odoo-sh-project-task-link") ||
    !projectUrl ||
    projectUrl === "" ||
    !branchGithubCommand ||
    !branchName
  )
    return;

  const taskId = await extractTaskId(branchName);
  if (!taskId || branchTitle.querySelector(".x-odoo-sh-project-task-link")) return;

  const taskLink = document.createElement("a");
  taskLink.href = projectUrl.replace("{{task_id}}", taskId);
  taskLink.target = "_blank";
  taskLink.title = t("page_features.sh_task_link.open_task");
  taskLink.className = "btn btn-light me-2 text-decoration-none x-odoo-sh-project-task-link";

  const icon = document.createElement("i");
  icon.className = "fa fa-tag";
  taskLink.append(t("page_features.sh_task_link.open_task_prefix"), icon);
  branchTitle.prepend(taskLink);
};

const addProjectTaskLinkBranchTitleBuildPage = async (
  currentLine: HTMLDivElement,
  projectUrl?: string,
): Promise<void> => {
  const leftDiv = currentLine.querySelector(".o_sh_build_panel_left") as HTMLDivElement;
  const nameDiv = leftDiv.querySelector(".o_branch_name") as HTMLDivElement;
  const branchName = nameDiv?.innerText;
  const buttonsRow = leftDiv.querySelector(".btn-group") as HTMLDivElement;

  if (
    !branchName ||
    !buttonsRow ||
    buttonsRow.querySelector(".x-odoo-sh-project-task-build-link") ||
    !projectUrl ||
    projectUrl === ""
  )
    return;

  const taskId = await extractTaskId(branchName);

  if (!taskId || buttonsRow.querySelector(".x-odoo-sh-project-task-build-link")) return;

  const taskLink = document.createElement("a");
  taskLink.href = projectUrl.replace("{{task_id}}", taskId);
  taskLink.target = "_blank";
  taskLink.classList.add("btn", "btn-sm", "btn-light", "x-odoo-sh-project-task-build-link");

  const icon = document.createElement("i");
  icon.className = "fa fa-tag";
  taskLink.appendChild(icon);
  buttonsRow.append(taskLink);
};

export { addProjectTaskLinkBranchTitle, addProjectTaskLinkBranchTitleBuildPage };
