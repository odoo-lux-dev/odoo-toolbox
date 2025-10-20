import { focusRecord } from "@/contexts/devtools-signals";
import { useRpcQuery } from "@/contexts/devtools-signals-hook";
import { Logger } from "@/services/logger";
import { odooRpcService } from "@/services/odoo-rpc-service";

/**
 * Custom hook to centralize record actions (open, focus)
 */
export const useRecordActions = () => {
    const { query: rpcQuery } = useRpcQuery();

    /**
     * Opens a single record in Odoo
     * @param record - The record to open
     * @param model - The model (optional, will use parentModel or rpcQuery.model)
     * @param event - The event for stopPropagation
     * @param asPopup - Open in popup or main tab
     */
    const openRecord = async (
        record: Record<string, unknown>,
        model: string | undefined,
        event: Event,
        asPopup = false,
    ) => {
        event.stopPropagation();

        const recordId = record.id as number;
        const modelToUse = model || rpcQuery.model;

        if (!recordId || !modelToUse) {
            Logger.warn("Cannot open record: missing ID or model", {
                recordId,
                model,
                queryModel: rpcQuery.model,
            });
            return;
        }

        try {
            await odooRpcService.openView({
                model: modelToUse,
                recordIds: recordId,
                asPopup,
            });
        } catch (error) {
            Logger.error("Failed to open record:", error);
        }
    };

    /**
     * Focus on a single record
     * @param record - The record to focus on
     * @param model - The model (optional, will use parentModel or rpcQuery.model)
     * @param event - The event for stopPropagation
     */
    const focusOnRecord = async (
        record: Record<string, unknown>,
        model: string | undefined,
        event: Event,
    ) => {
        event.stopPropagation();

        const recordId = record.id as number;
        const modelToUse = model || rpcQuery.model;

        if (!recordId || !modelToUse) {
            Logger.warn("Cannot focus record: missing ID or model", {
                recordId,
                model,
                queryModel: rpcQuery.model,
            });
            return;
        }

        try {
            await focusRecord(modelToUse, recordId);
        } catch (error) {
            Logger.error("Failed to focus record:", error);
        }
    };

    /**
     * Opens multiple records in Odoo (for relational fields)
     * @param ids - The IDs of records to open
     * @param model - The model of the records
     * @param event - The event for stopPropagation
     * @param asPopup - Open in popup or main tab
     */
    const openRecords = async (
        ids: number[],
        model: string,
        event: Event,
        asPopup = false,
    ) => {
        event.stopPropagation();

        if (!model || ids.length === 0) {
            Logger.warn("Cannot open records: missing model or IDs", {
                model,
                ids,
            });
            return;
        }

        try {
            await odooRpcService.openView({
                model,
                recordIds: ids,
                asPopup,
            });
        } catch (error) {
            Logger.error("Failed to open records:", error);
        }
    };

    /**
     * Focus on multiple records (for relational fields)
     * @param ids - The IDs of records to focus on
     * @param model - The model of the records
     * @param event - The event for stopPropagation
     */
    const focusOnRecords = async (
        ids: number[],
        model: string,
        event: Event,
    ) => {
        event.stopPropagation();

        if (ids.length === 0 || !model) {
            Logger.warn("Cannot focus records: no IDs or model", {
                ids,
                model,
            });
            return;
        }

        try {
            await focusRecord(model, ids);
        } catch (error) {
            Logger.error("Failed to focus records:", error);
        }
    };

    return {
        openRecord,
        focusOnRecord,
        openRecords,
        focusOnRecords,
    };
};
