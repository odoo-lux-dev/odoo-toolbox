import { ComponentChildren } from "preact";
import { useSignal } from "@preact/signals";
import { HugeiconsIcon } from "@hugeicons/react";
import { MagicWand05Icon } from "@hugeicons/core-free-icons";
import { useEffect } from "preact/hooks";
import { DomainEditor } from "@/components/devtools/domain-editor/domain-editor";
import { useGetCurrentPage } from "@/components/devtools/hooks/use-get-current-page";
import { FormField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { FieldSelect } from "@/components/devtools/selects/field-select";
import { ModelSelect } from "@/components/devtools/selects/model-select";
import { OrderBySelect } from "@/components/devtools/selects/order-by-select";
import {
    contextSignal,
    idsSignal,
    limitSignal,
    offsetSignal,
} from "@/contexts/devtools-signals";
import {
    useModelsState,
    useRpcQuery,
    useRpcResult,
} from "@/contexts/devtools-signals-hook";
import { Logger } from "@/services/logger";
import { odooRpcService } from "@/services/odoo-rpc-service";
import { parseRpcContext } from "@/utils/context-utils";

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

    showContextSection?: boolean;
    contextPlaceholder?: string;
    contextHelpText?: string;

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
    recordIdsHelpText,
    recordIdsPlaceholder = "1,2,3 or [1,2,3]",
    recordIdsValue,
    recordIdsRequired = false,
    onRecordIdsChange,

    showFieldsSection = false,
    fieldsPlaceholder = "All fields",

    showDomainSection = false,
    domainPlaceholder = '["field", "=", "value"]',

    showContextSection = true,
    contextPlaceholder = '{ "lang": "fr_BE" }',
    contextHelpText = "Additional context for RPC calls in JSON format.",

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

    const contextLoading = useSignal(false);
    const contextValidation = parseRpcContext(contextSignal.value || "");
    const contextError = contextValidation.isValid
        ? ""
        : `Invalid context format: ${contextValidation.error || "Invalid JSON"}`;

    const handleSetDefaultContext = async () => {
        if (contextLoading.value) return;
        contextLoading.value = true;
        try {
            const [companyRecords, langRecords] = await Promise.all([
                odooRpcService.searchRead({
                    model: "res.company",
                    fields: ["id"],
                }),
                odooRpcService.searchRead({
                    model: "res.lang",
                    fields: ["code"],
                }),
            ]);

            const companyIds = Array.isArray(companyRecords)
                ? companyRecords
                      .map((record) =>
                          Number((record as Record<string, unknown>).id ?? NaN),
                      )
                      .filter((id) => !Number.isNaN(id))
                : [];

            const langCodes = Array.isArray(langRecords)
                ? langRecords
                      .map((record) =>
                          String(
                              (record as Record<string, unknown>).code ?? "",
                          ),
                      )
                      .filter((code) => code)
                : [];

            const context: Record<string, unknown> = {};

            // Search for an English language, default to the first one if not found
            const preferredLang =
                langCodes.find((code) => code.startsWith("en_")) ||
                langCodes[0];

            if (preferredLang) {
                context.lang = preferredLang;
            }

            context.active_test = true;
            context.allowed_company_ids = companyIds;
            contextSignal.value = JSON.stringify(context);
        } catch (error) {
            Logger.error("Failed to set default context", error);
        } finally {
            contextLoading.value = false;
        }
    };

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
        <div className="flex h-full min-h-0 shrink-0 flex-col gap-4 bg-base-300 p-3">
            <div className="-mr-3 -ml-1 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto bg-base-300 pr-2 pl-1">
                {showModelSection && (
                    <FormField
                        label="Model"
                        required
                        helpText={
                            modelsState.error
                                ? "Models couldn't be fetched. Please enter your model name manually."
                                : ""
                        }
                        helpTone={modelsState.error ? "warning" : "neutral"}
                    >
                        <ModelSelect placeholder={modelPlaceholder} />
                    </FormField>
                )}

                {showRecordIdsSection && (
                    <FormField
                        label={recordIdsLabel}
                        required={recordIdsRequired}
                        helpText={recordIdsHelpText}
                    >
                        <Input
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
                            size="sm"
                            placeholder={recordIdsPlaceholder}
                            fullWidth
                            disabled={rpcResult.loading || isLoading}
                        />
                    </FormField>
                )}

                {showFieldsSection && (
                    <FormField label="Fields">
                        <FieldSelect placeholder={fieldsPlaceholder} />
                    </FormField>
                )}

                {showDomainSection && (
                    <FormField
                        label="Domain"
                        helpText="Filter conditions in Odoo domain format."
                    >
                        <DomainEditor placeholder={domainPlaceholder} />
                    </FormField>
                )}

                {showLimitOffsetSection && (
                    <div className="grid grid-cols-2 gap-3">
                        <FormField label="Limit">
                            <Input
                                type="number"
                                value={limitSignal.value}
                                onInput={(e) => {
                                    const target = e.target as HTMLInputElement;
                                    limitSignal.value =
                                        parseInt(target.value) || 80;
                                }}
                                size="sm"
                                placeholder="80"
                                min="0"
                                max="10000"
                                fullWidth
                                disabled={rpcResult.loading || isLoading}
                            />
                        </FormField>

                        <FormField label="Offset">
                            <Input
                                type="number"
                                value={offsetSignal.value}
                                onInput={(e) => {
                                    const target = e.target as HTMLInputElement;
                                    offsetSignal.value =
                                        parseInt(target.value) || 0;
                                }}
                                size="sm"
                                placeholder="0"
                                min="0"
                                fullWidth
                                disabled={rpcResult.loading || isLoading}
                            />
                        </FormField>
                    </div>
                )}

                {showContextSection && (
                    <FormField
                        label="Context"
                        helpText={contextError || contextHelpText}
                        helpTone={contextError ? "error" : "neutral"}
                    >
                        <div className="relative">
                            <Input
                                type="text"
                                value={contextSignal.value}
                                onInput={(e) => {
                                    const target = e.target as HTMLInputElement;
                                    contextSignal.value = target.value;
                                }}
                                placeholder={contextPlaceholder}
                                size="sm"
                                fullWidth
                                className="pr-8"
                                color={contextError ? "error" : undefined}
                                disabled={
                                    rpcResult.loading ||
                                    isLoading ||
                                    contextLoading.value
                                }
                            />
                            <IconButton
                                className="absolute top-1/2 right-2 -translate-y-1/2 text-base-content/60 hover:text-base-content"
                                label="Set default context"
                                type="button"
                                size="xs"
                                variant="ghost"
                                circle={false}
                                disabled={
                                    rpcResult.loading ||
                                    isLoading ||
                                    contextLoading.value
                                }
                                loading={contextLoading.value}
                                onClick={handleSetDefaultContext}
                                icon={
                                    contextLoading.value ? null : (
                                        <HugeiconsIcon
                                            icon={MagicWand05Icon}
                                            size={16}
                                            color="currentColor"
                                            strokeWidth={1.6}
                                        />
                                    )
                                }
                            />
                        </div>
                    </FormField>
                )}

                {showOrderBySection && (
                    <FormField
                        label="Order By"
                        helpText="Multiple selections will be applied in order."
                    >
                        <OrderBySelect placeholder={orderByPlaceholder} />
                    </FormField>
                )}

                {children}
            </div>

            <div className="flex flex-col gap-3">
                {onPrimaryAction && (
                    <div>
                        <Button
                            color="primary"
                            block
                            onClick={onPrimaryAction}
                            disabled={
                                finalPrimaryActionDisabled ||
                                rpcResult.loading ||
                                isLoading
                            }
                            loading={rpcResult.loading || isLoading}
                            title="Click or press Ctrl+Enter to execute"
                            className="justify-between"
                        >
                            <span className="flex w-full items-center justify-between">
                                <span>
                                    {rpcResult.loading || isLoading
                                        ? "Loading..."
                                        : primaryActionLabel}
                                </span>
                                {!rpcResult.loading && !isLoading ? (
                                    <span className="flex items-center gap-1 text-xs opacity-70">
                                        <Kbd
                                            size="sm"
                                            className="not-dark:text-primary"
                                        >
                                            ⌃
                                        </Kbd>
                                        <span>+</span>
                                        <Kbd
                                            size="sm"
                                            className="not-dark:text-primary"
                                        >
                                            ⏎
                                        </Kbd>
                                    </span>
                                ) : null}
                            </span>
                        </Button>
                    </div>
                )}

                <div className="flex w-full gap-2">
                    <div className="flex-1">
                        <Button
                            variant="outline"
                            color="primary"
                            onClick={handleGetCurrent}
                            disabled={rpcResult.loading || isLoading}
                            className="w-full"
                            size="sm"
                            title="Get information from the current page"
                        >
                            Get Current
                        </Button>
                    </div>
                    <div className="flex-1">
                        <Button
                            variant="outline"
                            color="secondary"
                            onClick={handleClear}
                            disabled={rpcResult.loading || isLoading}
                            className="w-full"
                            size="sm"
                        >
                            Clear
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
