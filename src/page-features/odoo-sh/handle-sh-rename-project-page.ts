import { t } from "@/utils/i18n-page";

const PAGE_TITLE_KEYS: [segment: string, key: string][] = [
  ["builds", "page_features.sh_rename.builds"],
  ["status", "page_features.sh_rename.status"],
  ["logs", "page_features.sh_rename.audit_logs"],
  ["settings", "page_features.sh_rename.settings"],
];

/** Titles the tab `<display name> (SH) - <page>`; the branches page is the default. */
const renameShProjectPageTitle = (currentProjectName: string, baseProjectName: string): void => {
  const currentUrl = window.location.href;
  const titleKey =
    PAGE_TITLE_KEYS.find(([segment]) =>
      currentUrl.includes(`project/${baseProjectName}/${segment}`),
    )?.[1] ?? "page_features.sh_rename.branches";
  document.title = `${currentProjectName} (SH) - ${t(titleKey)}`;
};

export { renameShProjectPageTitle };
