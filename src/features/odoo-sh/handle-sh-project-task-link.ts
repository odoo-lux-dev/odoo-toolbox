import { parseTaskTitle } from "@/utils/regex"

const extractTaskId = async (branchName: string): Promise<string | null> => {
  const match = await parseTaskTitle(branchName)
  return match ? match[1] : null
}

const addProjectTaskLinkBranchTitle = async (
  projectUrl?: string
): Promise<void> => {
  const branchTitle = document.querySelector(
    "div.o_branch_header_title h4"
  ) as HTMLHeadingElement

  if (
    !branchTitle ||
    branchTitle.querySelector(".x-odoo-sh-project-task-link") ||
    !projectUrl ||
    projectUrl === ""
  )
    return

  const branchName = branchTitle.innerText
  const taskId = await extractTaskId(branchName)

  if (!taskId || branchTitle.querySelector(".x-odoo-sh-project-task-link"))
    return

  const taskLink = document.createElement("a")
  taskLink.href = projectUrl.replace("{{task_id}}", taskId)
  taskLink.target = "_blank"

  const icon = document.createElement("i")
  icon.className = "fa fa-tag"
  taskLink.appendChild(icon)
  taskLink.className = "x-odoo-sh-project-task-link text-decoration-none"
  branchTitle.append(taskLink)
}

const addProjectTaskLinkBranchTitleBuildPage = async (
  currentLine: HTMLDivElement,
  projectUrl?: string
): Promise<void> => {
  const branchName = currentLine.getAttribute("data-branch-name")
  const buttonsRow = currentLine.querySelector(".btn-group") as HTMLDivElement

  if (
    !branchName ||
    !buttonsRow ||
    buttonsRow.querySelector(".x-odoo-sh-project-task-build-link") ||
    !projectUrl ||
    projectUrl === ""
  )
    return

  const taskId = await extractTaskId(branchName)

  if (!taskId || buttonsRow.querySelector(".x-odoo-sh-project-task-build-link"))
    return

  const taskLink = document.createElement("a")
  taskLink.href = projectUrl.replace("{{task_id}}", taskId)
  taskLink.target = "_blank"
  taskLink.classList.add(
    "btn",
    "btn-sm",
    "btn-light",
    "x-odoo-sh-project-task-build-link"
  )

  const icon = document.createElement("i")
  icon.className = "fa fa-tag"
  taskLink.appendChild(icon)
  buttonsRow.append(taskLink)
}

export { addProjectTaskLinkBranchTitle, addProjectTaskLinkBranchTitleBuildPage }
