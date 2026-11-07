import { QueryWorkspace } from "@/screens/devtools/components/devtools-ui";
import { QueryFormSidebar } from "@/screens/devtools/components/query-form-sidebar";
import { ResultViewer } from "@/screens/devtools/components/result-viewer";
import { executeQuery } from "@/screens/devtools/devtools-signals";
import { t } from "@/services/i18n-service";

export const SearchTab = () => (
  <QueryWorkspace
    rail={
      <QueryFormSidebar
        title={t("devtools.nav.search")}
        method="search_read"
        recordIds={{ help: t("devtools.sidebar.record_ids_search_help") }}
        showFieldsSection
        showDomainSection
        showLimitOffsetSection
        showOrderBySection
        primaryAction={{ label: t("devtools.sidebar.execute_query"), run: () => executeQuery() }}
      />
    }
  >
    <ResultViewer title={t("devtools.nav.search")} />
  </QueryWorkspace>
);
