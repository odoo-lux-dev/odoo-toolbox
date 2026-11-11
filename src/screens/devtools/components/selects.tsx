import { createMemo, onMount } from "solid-js";

import { formatOrderBy, parseOrderBy } from "@/screens/devtools/components/order-by";
import { Select } from "@/screens/devtools/components/select";
import type { SelectOption } from "@/screens/devtools/components/select-options";
import {
  loadModels,
  modelsStore,
  queryStore,
  railFieldsMetadata,
  resultStore,
  setQueryStore,
  setRpcQuery,
} from "@/screens/devtools/devtools-signals";
import { t } from "@/services/i18n-service";
import type { FieldMetadata } from "@/types";
import { PSEUDO_FIELD_METADATA } from "@/utils/pseudo-fields";

const fieldOption = (name: string, info: FieldMetadata): SelectOption => ({
  value: name,
  label: info.string || name,
  searchableText: `${name} ${info.string || name} ${info.type}`,
});

export const FieldSelect = (props: { placeholder?: string }) => {
  const fieldOptions = createMemo((): SelectOption[] => {
    const fieldsMetadata = railFieldsMetadata();
    if (!queryStore.model || !fieldsMetadata) return [];
    // Pseudo-fields (e.g. xml_id) can be picked like real fields.
    const pseudoFields = Object.entries(PSEUDO_FIELD_METADATA).filter(
      ([name]) => !fieldsMetadata[name],
    );
    return [...Object.entries(fieldsMetadata), ...pseudoFields].map(([name, info]) =>
      fieldOption(name, info),
    );
  });

  return (
    <Select
      multiple
      options={fieldOptions()}
      value={queryStore.selectedFields}
      onChange={(selectedFields) => setRpcQuery({ selectedFields, offset: 0 })}
      chipWarning={(value) =>
        (resultStore.excludedFields ?? []).includes(value)
          ? t("devtools.selects.excluded_title", [value])
          : undefined
      }
      placeholder={props.placeholder ?? t("devtools.selects.search_fields")}
      disabled={!queryStore.model || resultStore.loading}
    />
  );
};

export const ModelSelect = (props: { placeholder?: string }) => {
  const modelOptions = createMemo((): SelectOption[] =>
    modelsStore.models.map((model) => ({
      value: model.model,
      label: model.name,
      searchableText: `${model.model} ${model.name}`,
    })),
  );

  onMount(() => void loadModels());

  return (
    <Select
      options={modelOptions()}
      value={queryStore.model}
      onChange={(model) => setRpcQuery({ model, selectedFields: [], offset: 0 })}
      placeholder={props.placeholder ?? t("devtools.selects.select_model")}
      disabled={resultStore.loading}
      loading={modelsStore.loading}
      error={modelsStore.error || ""}
      onRefresh={() => loadModels(true)}
    />
  );
};

export const OrderBySelect = (props: { placeholder?: string }) => {
  const orderByOptions = createMemo((): SelectOption[] => {
    const fieldsMetadata = railFieldsMetadata();
    if (!queryStore.model || !fieldsMetadata) return [];

    return Object.entries(fieldsMetadata)
      .filter(([, info]) => info.sortable)
      .toSorted(([a], [b]) => a.toLowerCase().localeCompare(b.toLowerCase()))
      .flatMap(([name, info]) => {
        const label = info.string || name;
        return [
          {
            value: `${name} ASC`,
            label: `${label} ${t("devtools.selects.asc")}`,
            searchableText: `${name} ${label} asc ascending`,
          },
          {
            value: `${name} DESC`,
            label: `${label} ${t("devtools.selects.desc")}`,
            searchableText: `${name} ${label} desc descending`,
          },
        ];
      });
  });

  return (
    <Select
      multiple
      options={orderByOptions()}
      value={parseOrderBy(queryStore.orderBy)}
      onChange={(values) => setQueryStore("orderBy", formatOrderBy(values))}
      placeholder={props.placeholder ?? t("devtools.selects.order_by_placeholder")}
      disabled={!queryStore.model || resultStore.loading}
    />
  );
};
