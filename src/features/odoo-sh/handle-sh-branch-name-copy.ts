/**
 * Adds a copy icon to the branch title element, allowing users to copy the branch name to the clipboard.
 */
const addCopyIconToBranchTitle = (): void => {
    const branchTitle = document.querySelector(
        "div.o_branch_header_title h4"
    ) as HTMLHeadingElement

    if (
        !branchTitle ||
        branchTitle.querySelector(".x-odoo-sh-copy-branch-name")
    )
        return

    const branchName = branchTitle.innerText
    branchTitle.classList.add("d-flex", "align-items-center")

    const copyIconContainer = document.createElement("div")
    const icon = document.createElement("i")
    icon.className = "fa fa-clone"
    copyIconContainer.className = "x-odoo-sh-copy-branch-name"
    copyIconContainer.appendChild(icon)
    copyIconContainer.onclick = () => {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(branchName).then(() => {
                icon.className = "fa fa-check text-success"
                setTimeout(() => {
                    icon.className = "fa fa-clone"
                }, 2000)
            })
        }
    }
    branchTitle.append(copyIconContainer)
}

const addCopyIconToBranchTitleBuildPage = (
    currentLine: HTMLDivElement
): void => {
    const branchName = currentLine.getAttribute("data-branch-name")
    const buttonsRow = currentLine.querySelector(".btn-group") as HTMLDivElement

    if (
        !branchName ||
        !buttonsRow ||
        buttonsRow.querySelector(".x-odoo-sh-copy-branch-build-name")
    )
        return

    const copyIconContainer = document.createElement("a")
    copyIconContainer.classList.add(
        "btn",
        "btn-sm",
        "btn-light",
        "x-odoo-sh-copy-branch-build-name"
    )
    const icon = document.createElement("i")
    icon.className = "fa fa-clone"

    copyIconContainer.appendChild(icon)

    copyIconContainer.onclick = () => {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(branchName).then(() => {
                icon.className = "fa fa-check text-success"
                setTimeout(() => {
                    icon.className = "fa fa-clone"
                }, 2000)
            })
        }
    }
    buttonsRow.appendChild(copyIconContainer)
}

export { addCopyIconToBranchTitle, addCopyIconToBranchTitleBuildPage }
