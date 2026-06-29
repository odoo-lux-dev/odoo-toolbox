import { createMemo, createSignal } from "solid-js";

import { queryStore } from "@/screens/devtools/devtools-signals";
import { odooRpcService } from "@/services/odoo-rpc-service";
import { FieldMetadata } from "@/types";

export const useFieldMetadata = (
  fieldName: () => string,
  parentFieldsMetadata?: () => Record<string, FieldMetadata> | undefined,
): (() => FieldMetadata | null) => {
  return createMemo(() => {
    const name = fieldName();
    const parent = parentFieldsMetadata?.();
    if (parent) {
      return parent[name] || null;
    }
    return queryStore.fieldsMetadata?.[name] || null;
  });
};

export const useFieldMetadataRenderer = () => {
  const getValueClasses = (value: unknown): string => {
    if (typeof value === "boolean") return "cell-boolean";
    if (typeof value === "number") return "cell-number";
    if (typeof value === "string") return "cell-string";
    if (value === null || value === undefined) return "cell-object";
    if (typeof value === "object") return "cell-object";
    return "";
  };

  const formatSimpleValue = (value: unknown): string => {
    if (value === null || value === undefined) return "null";
    if (typeof value === "boolean") return value.toString();
    if (typeof value === "number") return value.toString();
    if (typeof value === "string") return `"${value}"`;
    return String(value);
  };

  const prepareMetadataItems = (metadata: FieldMetadata) => {
    const items: Array<{
      key: string;
      value: unknown;
      classes: string;
      isComplexType: boolean;
      formattedValue: string;
    }> = [];

    if (
      metadata.help &&
      metadata.help !== null &&
      metadata.help !== undefined &&
      metadata.help !== ""
    ) {
      const isComplex =
        Array.isArray(metadata.help) ||
        (typeof metadata.help === "object" && metadata.help !== null);
      items.push({
        key: "Help",
        value: metadata.help,
        classes: getValueClasses(metadata.help),
        isComplexType: isComplex,
        formattedValue: isComplex ? "" : formatSimpleValue(metadata.help),
      });
    }

    Object.entries(metadata).forEach(([key, value]) => {
      if (
        key !== "name" &&
        key !== "help" &&
        value !== null &&
        value !== undefined &&
        value !== ""
      ) {
        const displayKey = key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
        const isComplex = Array.isArray(value) || (typeof value === "object" && value !== null);
        items.push({
          key: displayKey,
          value,
          classes: getValueClasses(value),
          isComplexType: isComplex,
          formattedValue: isComplex ? "" : formatSimpleValue(value),
        });
      }
    });

    return items;
  };

  return {
    prepareMetadataItems,
    getValueClasses,
    formatSimpleValue,
  };
};

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

export const useExpansion = (
  onExpandToggle?: (index: number) => void,
  externalExpandedRecords?: () => Set<number>,
) => {
  const [localExpandedRecords, setLocalExpandedRecords] = createSignal<Set<number>>(new Set());

  const currentExpanded = () =>
    onExpandToggle ? (externalExpandedRecords?.() ?? new Set()) : localExpandedRecords();

  const toggleExpansion = (index: number) => {
    if (onExpandToggle) {
      onExpandToggle(index);
    } else {
      const current = localExpandedRecords();
      const newExpanded = new Set(current);
      if (newExpanded.has(index)) {
        newExpanded.delete(index);
      } else {
        newExpanded.add(index);
      }
      setLocalExpandedRecords(newExpanded);
    }
  };

  return {
    currentExpanded,
    toggleExpansion,
  };
};
