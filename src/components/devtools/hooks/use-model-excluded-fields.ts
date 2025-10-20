import { odooRpcService } from "@/services/odoo-rpc-service";

export const useModelExcludedFields = () => {
    const hasModelExcludedFields = (modelName: string): boolean => {
        const config = odooRpcService.getExcludedFieldsConfig();
        return modelName in config && config[modelName].length > 0;
    };

    const getModelExcludedFields = (modelName: string): string[] => {
        const config = odooRpcService.getExcludedFieldsConfig();
        return config[modelName] || [];
    };

    return {
        hasModelExcludedFields,
        getModelExcludedFields,
    };
};
