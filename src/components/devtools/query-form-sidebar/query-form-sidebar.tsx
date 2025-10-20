import "@/components/devtools/query-form-sidebar/query-form-sidebar.styles.scss";
import { ComponentChildren } from "preact";
import { useEffect } from "preact/hooks";
import { DomainEditor } from "@/components/devtools/domain-editor/domain-editor";
import { useGetCurrentPage } from "@/components/devtools/hooks/use-get-current-page";
import { FormSection } from "@/components/devtools/query-form-sidebar/form-section";
import { FieldSelect } from "@/components/devtools/selects/field-select";
import { ModelSelect } from "@/components/devtools/selects/model-select";
import {
    idsSignal,
    limitSignal,
    offsetSignal,
    orderBySignal,
} from "@/contexts/devtools-signals";
import {
    useModelsState,
    useRpcQuery,
    useRpcResult,
} from "@/contexts/devtools-signals-hook";
import { Logger } from "@/services/logger";

interface QueryFormSidebarProps {
    children?: ComponentChildren;
    showModelSection?: boolean;
    modelPlaceholder?: string;

    showRecordIdsSection?: boolean;
    recordIdsLabel?: string;
    recordIdsHelpText?: string;
    recordIdsPlaceholder?: string;
    recordIdsValue?: string;
    recordIdsRequired?: boolean;
    onRecordIdsChange?: (value: string) => void;

    showFieldsSection?: boolean;
    fieldsPlaceholder?: string;

    showDomainSection?: boolean;
    domainPlaceholder?: string;

    showLimitOffsetSection?: boolean;

    showOrderBySection?: boolean;
    orderByPlaceholder?: string;

    primaryActionLabel?: string;
    primaryActionDisabled?: boolean;
    onPrimaryAction?: () => void;
    onGetCurrent?: () => void;
    onClear?: () => void;
    isLoading?: boolean;

    computePrimaryActionDisabled?: boolean;
}

export const QueryFormSidebar = ({
    children,
    showModelSection = true,
    modelPlaceholder = "Type to search for a model...",

    showRecordIdsSection = true,
    recordIdsLabel = "Record IDs",
    recordIdsHelpText = "Comma-separated IDs or JSON array. Leave empty for all records.",
    recordIdsPlaceholder = "1,2,3 or [1,2,3]",
    recordIdsValue,
    recordIdsRequired = false,
    onRecordIdsChange,

    showFieldsSection = false,
    fieldsPlaceholder = "All fields",

    showDomainSection = false,
    domainPlaceholder = '["field", "=", "value"]',

    showLimitOffsetSection = false,

    showOrderBySection = false,
    orderByPlaceholder = "id desc",

    primaryActionLabel = "Execute Query",
    primaryActionDisabled = false,
    onPrimaryAction,
    onGetCurrent,
    onClear,
    isLoading = false,

    computePrimaryActionDisabled = false,
}: QueryFormSidebarProps) => {
    const { query: rpcQuery } = useRpcQuery();
    const { result: rpcResult } = useRpcResult();
    const { modelsState } = useModelsState();

    const { getAndApplyCurrentPage } = useGetCurrentPage();

    const finalPrimaryActionDisabled = computePrimaryActionDisabled
        ? !rpcQuery.model || !rpcQuery.isQueryValid
        : primaryActionDisabled;

    const handleGetCurrent = async () => {
        if (onGetCurrent) {
            onGetCurrent();
        } else {
            await getAndApplyCurrentPage({
                showNotifications: true,
                autoExecute: true,
                onError: (error: unknown) => {
                    Logger.error("Error in handleGetCurrent:", error);
                },
            });
        }
    };

    const handleClear = () => {
        if (onClear) {
            onClear();
        }
    };

    // Handle CTRL+Enter keyboard shortcut
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.ctrlKey && event.key === "Enter" && onPrimaryAction) {
            event.preventDefault();
            if (
                !finalPrimaryActionDisabled &&
                !rpcResult.loading &&
                !isLoading
            ) {
                onPrimaryAction();
            }
        }
    };

    // Add keyboard event listener
    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [
        finalPrimaryActionDisabled,
        rpcResult.loading,
        isLoading,
        onPrimaryAction,
    ]);

    return (
        <div className="query-form">
            {showModelSection && (
                <FormSection
                    label="Model"
                    required
                    helpText={
                        modelsState.error
                            ? "Models couldn't be fetched. Please enter your model name manually."
                            : "Select your model"
                    }
                    helpTextWarning={!!modelsState.error}
                >
                    <ModelSelect placeholder={modelPlaceholder} />
                </FormSection>
            )}

            {showRecordIdsSection && (
                <FormSection
                    label={recordIdsLabel}
                    required={recordIdsRequired}
                    helpText={recordIdsHelpText}
                >
                    <input
                        type="text"
                        value={recordIdsValue ?? idsSignal.value}
                        onInput={(e) => {
                            const target = e.target as HTMLInputElement;
                            idsSignal.value = target.value;
                        }}
                        onBlur={() => {
                            if (onRecordIdsChange) {
                                onRecordIdsChange(idsSignal.value);
                            }
                        }}
                        placeholder={recordIdsPlaceholder}
                        className="form-input"
                        disabled={rpcResult.loading || isLoading}
                    />
                </FormSection>
            )}

            {showFieldsSection && (
                <FormSection
                    label="Fields"
                    helpText="Leave empty to fetch all fields."
                >
                    <FieldSelect placeholder={fieldsPlaceholder} />
                </FormSection>
            )}

            {showDomainSection && (
                <FormSection
                    label="Domain"
                    helpText="Filter conditions in Odoo domain format."
                >
                    <DomainEditor placeholder={domainPlaceholder} />
                </FormSection>
            )}

            {showLimitOffsetSection && (
                <div className="form-row">
                    <FormSection label="Limit">
                        <input
                            type="number"
                            value={limitSignal.value}
                            onInput={(e) => {
                                const target = e.target as HTMLInputElement;
                                limitSignal.value =
                                    parseInt(target.value) || 80;
                            }}
                            placeholder="80"
                            className="form-input"
                            min="0"
                            max="10000"
                            disabled={rpcResult.loading || isLoading}
                        />
                    </FormSection>

                    <FormSection label="Offset">
                        <input
                            type="number"
                            value={offsetSignal.value}
                            onInput={(e) => {
                                const target = e.target as HTMLInputElement;
                                offsetSignal.value =
                                    parseInt(target.value) || 0;
                            }}
                            placeholder="0"
                            className="form-input"
                            min="0"
                            disabled={rpcResult.loading || isLoading}
                        />
                    </FormSection>
                </div>
            )}

            {showOrderBySection && (
                <FormSection label="Order By">
                    <input
                        type="text"
                        value={orderBySignal.value}
                        disabled={rpcResult.loading || isLoading}
                        onInput={(e) => {
                            const target = e.target as HTMLInputElement;
                            orderBySignal.value = target.value;
                        }}
                        placeholder={orderByPlaceholder}
                        className="form-input"
                    />
                </FormSection>
            )}

            {children}

            <div className="form-actions">
                {onPrimaryAction && (
                    <div className="form-actions-row">
                        <button
                            type="button"
                            onClick={onPrimaryAction}
                            disabled={
                                finalPrimaryActionDisabled ||
                                rpcResult.loading ||
                                isLoading
                            }
                            className="btn btn-primary btn-full-width primary-btn-action"
                            title="Click or press Ctrl+Enter to execute"
                        >
                            <span className="btn-content">
                                <span className="btn-text">
                                    {rpcResult.loading || isLoading
                                        ? "Loading..."
                                        : primaryActionLabel}
                                </span>
                                {!rpcResult.loading && !isLoading && (
                                    <span
                                        className="btn-shortcut"
                                        title="Ctrl+Enter"
                                    >
                                        <kbd>⌃</kbd> + <kbd>⏎</kbd>
                                    </span>
                                )}
                            </span>
                        </button>
                    </div>
                )}

                <div className="form-actions-row">
                    <button
                        type="button"
                        onClick={handleGetCurrent}
                        disabled={rpcResult.loading || isLoading}
                        className="btn btn-primary-outline"
                        title="Get information from the current page"
                    >
                        Get Current
                    </button>
                    <button
                        type="button"
                        onClick={handleClear}
                        disabled={rpcResult.loading || isLoading}
                        className="btn btn-secondary-outline"
                    >
                        Clear
                    </button>
                </div>
            </div>
        </div>
    );
};
