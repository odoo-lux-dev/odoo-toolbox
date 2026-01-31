import { QueryFormSidebar } from "@/components/devtools/query-form-sidebar/query-form-sidebar";
import { ResultViewer } from "@/components/devtools/result-viewer/result-viewer";
import {
    executeQuery,
    resetRpcQuery,
    resetRpcResult,
} from "@/contexts/devtools-signals";
import { useRpcQuery } from "@/contexts/devtools-signals-hook";

export const SearchTab = () => {
    const { query: rpcQuery } = useRpcQuery();

    const handleExecuteQuery = async () => {
        await executeQuery(true);
    };

    const handleClearForm = () => {
        resetRpcQuery();
        resetRpcResult();
    };

    const isPrimaryActionDisabled = !rpcQuery.model || !rpcQuery.isQueryValid;

    return (
        <div className="grid h-full min-h-0 grid-cols-1 bg-base-300 lg:grid-cols-[320px_1fr] lg:grid-rows-[minmax(0,1fr)]">
            <QueryFormSidebar
                showFieldsSection={true}
                showDomainSection={true}
                showLimitOffsetSection={true}
                showOrderBySection={true}
                primaryActionLabel="Execute Query"
                primaryActionDisabled={isPrimaryActionDisabled}
                onPrimaryAction={handleExecuteQuery}
                onClear={handleClearForm}
                recordIdsHelpText="Comma-separated IDs or array. Empty for all records."
            />

            <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden rounded-tl-xl bg-base-100 px-3">
                <ResultViewer />
            </div>
        </div>
    );
};
