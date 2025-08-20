const REGEX_GITHUB_REPO_FROM_GIT_URL =
    /(?:git@|https:\/\/|git:\/\/)[^/:]+[:/](?<repo_info>[^/]+\/[^/]+)\.git/

/**
 * Adds a GitHub icon to the branch title element, linking to the corresponding branch on GitHub.
 */
const addGithubIconToBranchTitle = (): void => {
    const branchTitle = document.querySelector(
        "div.o_branch_header_title h4"
    ) as HTMLHeadingElement

    const githubCommandInput = document.querySelector(
        "input[name='git_command']"
    ) as HTMLInputElement

    const githubRepoInfo = githubCommandInput.value.match(
        REGEX_GITHUB_REPO_FROM_GIT_URL
    )?.groups?.repo_info

    if (
        !branchTitle ||
        branchTitle.querySelector(".x-odoo-sh-github-link") ||
        !githubCommandInput ||
        !githubRepoInfo
    )
        return

    const branchName = branchTitle.innerText
    const githubIconLink = document.createElement("a")
    githubIconLink.href = `https://github.com/${githubRepoInfo}/tree/${branchName}`
    githubIconLink.target = "_blank"

    const icon = document.createElement("i")
    icon.className = "fa fa-github"
    githubIconLink.className = "x-odoo-sh-github-link text-decoration-none"
    githubIconLink.appendChild(icon)
    branchTitle.append(githubIconLink)
}

export { addGithubIconToBranchTitle }
