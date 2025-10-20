import "@/entries/devtools-panel/tabs/tabs.style.scss";
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
        <div className="rpc-query-form">
            <QueryFormSidebar
                showFieldsSection={true}
                showDomainSection={true}
                showLimitOffsetSection={true}
                showOrderBySection={true}
                primaryActionLabel="Execute Query"
                primaryActionDisabled={isPrimaryActionDisabled}
                onPrimaryAction={handleExecuteQuery}
                onClear={handleClearForm}
                recordIdsHelpText="Comma-separated IDs or JSON array. Leave empty for all records."
            />

            <div className="tab-results">
                <ResultViewer />
            </div>
        </div>
    );
};
