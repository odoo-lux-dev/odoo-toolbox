export interface FieldMetadata {
  string: string;
  type: string;
  relation?: string;
  relation_field?: string;
  readonly?: boolean;
  required?: boolean;
  [key: string]: unknown;
}

export interface RpcQueryState {
  model: string;
  selectedFields: string[];
  domain: string;
  ids: string;
  limit: number;
  offset: number;
  orderBy: string;
  context?: string;
}

export interface RpcResultState {
  data: Record<string, unknown>[] | null;
  loading: boolean;
  error: string | null;
  errorDetails?: unknown;
  totalCount: number | null;
  lastQuery: RpcQueryState | null;
  isNewQuery: boolean;
  model: string | null;
  fieldsMetadata?: Record<string, FieldMetadata>;
  excludedFields?: string[];
}

export interface OdooModel {
  model: string;
  name: string;
}

export interface ModelsState {
  models: OdooModel[];
  loading: boolean;
  error: string | null;
}
