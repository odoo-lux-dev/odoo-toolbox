const renameShProjectPageTitle = (
    currentProjectName: string,
    baseProjectName: string,
): void => {
    let urlSubPart = "Branches";
    const currentUrl = window.location.href;

    if (
        currentUrl.includes(`project/${baseProjectName}/branches`) ||
        currentUrl.endsWith(`project/${baseProjectName}`)
    ) {
        urlSubPart = "Branches";
    } else if (currentUrl.includes(`project/${baseProjectName}/builds`)) {
        urlSubPart = "Builds";
    } else if (currentUrl.includes(`project/${baseProjectName}/status`)) {
        urlSubPart = "Status";
    } else if (currentUrl.includes(`project/${baseProjectName}/logs`)) {
        urlSubPart = "Audit Logs";
    } else if (currentUrl.includes(`project/${baseProjectName}/settings`)) {
        urlSubPart = "Settings";
    }
    document.title = `${currentProjectName} (SH) - ${urlSubPart}`;
};

export { renameShProjectPageTitle };
