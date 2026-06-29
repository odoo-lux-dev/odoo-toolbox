import { t } from "@/services/i18n-service";
export const Header = () => (
  <header class="border-b-2 border-base-200 bg-primary p-4 dark:bg-base-100">
    <h2 class="text-center text-xl font-semibold text-gray-100 dark:text-base-content">
      {t("popup.header_your")}{" "}
      <a
        href="https://www.odoo.sh/project"
        target="_blank"
        rel="noreferrer noopener"
        class="text-accent dark:text-primary"
      >
        {t("popup.header_sh")}
      </a>{" "}
      {t("popup.header_projects")}
    </h2>
  </header>
);
