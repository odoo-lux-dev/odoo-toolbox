import { QueryFormSidebar } from "@/screens/devtools/components/query-form-sidebar";
import { ResultViewer } from "@/screens/devtools/components/result-viewer";
import {
  executeQuery,
  isQueryValid,
  queryStore,
  resetRpcQuery,
  resetRpcResult,
} from "@/screens/devtools/devtools-signals";
import { t } from "@/services/i18n-service";

export const SearchTab = () => {
  const handleExecuteQuery = async () => {
    await executeQuery(true);
  };

  const handleClearForm = () => {
    resetRpcQuery();
    resetRpcResult();
  };

  const isPrimaryActionDisabled = () => !queryStore.model || !isQueryValid();

  return (
    <div class="grid h-full min-h-0 grid-cols-1 bg-base-300 lg:grid-cols-[320px_1fr] lg:grid-rows-[minmax(0,1fr)]">
      <QueryFormSidebar
        showFieldsSection={true}
        showDomainSection={true}
        showLimitOffsetSection={true}
        showOrderBySection={true}
        primaryActionLabel={t("devtools.sidebar.execute_query")}
        primaryActionDisabled={isPrimaryActionDisabled()}
        onPrimaryAction={handleExecuteQuery}
        onClear={handleClearForm}
        recordIdsHelpText={t("devtools.sidebar.record_ids_search_help")}
      />

      <div class="flex h-full min-h-0 flex-col gap-4 overflow-hidden rounded-tl-xl bg-base-100 px-3">
        <ResultViewer />
      </div>
    </div>
  );
};
