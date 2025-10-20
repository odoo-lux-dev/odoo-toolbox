import { FieldMetadata } from "@/types";

export interface BaseFieldProps {
    value: unknown;
    fieldName: string;
    fieldMetadata: FieldMetadata | null;
    onContextMenu?: (
        event: MouseEvent,
        fieldName: string,
        value: unknown,
        fieldMetadata: FieldMetadata | null,
    ) => void;
}

export interface FieldRenderingProps extends BaseFieldProps {
    level?: number;
    parentModel?: string;
    showAsRowWithLabel?: boolean;
    parentFieldsMetadata?: Record<string, FieldMetadata>;
    additionalClasses?: string;
}
