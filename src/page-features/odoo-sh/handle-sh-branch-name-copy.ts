import { copyWithFeedback } from "@/utils/clipboard";

import { getBuildLineParts, getCurrentBranchName } from "./branch";

const makeCopyButton = (container: HTMLElement, branchName: string): HTMLElement => {
  const icon = document.createElement("i");
  icon.className = "fa fa-clone";
  container.appendChild(icon);
  container.onclick = () => copyWithFeedback(branchName, container);
  return container;
};

const addCopyIconToBranchTitle = (): void => {
  const branchTitle = document.querySelector<HTMLDivElement>("div.o_branch_header_title");
  const branchName = getCurrentBranchName();
  if (!branchTitle || !branchName || branchTitle.querySelector(".x-odoo-sh-copy-branch-name")) {
    return;
  }

  branchTitle.classList.add("d-flex", "align-items-center");
  const container = document.createElement("div");
  container.className = "x-odoo-sh-copy-branch-name";
  branchTitle.append(makeCopyButton(container, branchName));
};

const addCopyIconToBranchTitleBuildPage = (buildLine: Element): void => {
  const { branchName, buttonsRow } = getBuildLineParts(buildLine);
  if (!branchName || !buttonsRow || buttonsRow.querySelector(".x-odoo-sh-copy-branch-build-name")) {
    return;
  }

  const container = document.createElement("a");
  container.className = "btn btn-sm btn-light x-odoo-sh-copy-branch-build-name";
  buttonsRow.appendChild(makeCopyButton(container, branchName));
};

export { addCopyIconToBranchTitle, addCopyIconToBranchTitleBuildPage };
