import { t } from "@/utils/i18n-page";
const renameShProjectPageTitle = (currentProjectName: string, baseProjectName: string): void => {
  let urlSubPart = t("page_features.sh_rename.branches");
  const currentUrl = window.location.href;

  if (
    currentUrl.includes(`project/${baseProjectName}/branches`) ||
    currentUrl.endsWith(`project/${baseProjectName}`)
  ) {
    urlSubPart = t("page_features.sh_rename.branches");
  } else if (currentUrl.includes(`project/${baseProjectName}/builds`)) {
    urlSubPart = t("page_features.sh_rename.builds");
  } else if (currentUrl.includes(`project/${baseProjectName}/status`)) {
    urlSubPart = t("page_features.sh_rename.status");
  } else if (currentUrl.includes(`project/${baseProjectName}/logs`)) {
    urlSubPart = t("page_features.sh_rename.audit_logs");
  } else if (currentUrl.includes(`project/${baseProjectName}/settings`)) {
    urlSubPart = t("page_features.sh_rename.settings");
  }
  document.title = `${currentProjectName} (SH) - ${urlSubPart}`;
};

export { renameShProjectPageTitle };
