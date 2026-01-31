import { JSX } from "preact";
import type { ActionButton } from "@/components/shared/notifications/notifications.types";
import { FieldMetadata } from "@/types";

export const createFieldValidationErrorNotification = (
    invalidFields: string[],
): JSX.Element => {
    const fieldCount = invalidFields.length;
    const isPlural = fieldCount > 1;

    return (
        <div className="flex flex-col gap-2 text-sm text-base-content">
            <div className="font-semibold">
                <strong>
                    {isPlural
                        ? `${fieldCount} invalid fields detected:`
                        : "Invalid field detected:"}
                </strong>
            </div>
            <div className="flex flex-wrap gap-1">
                {invalidFields.map((field, index) => (
                    <span key={field} className="inline-flex items-center">
                        <code className="rounded-sm bg-base-200 px-1.5 py-0.5 font-mono text-[11px] text-error">
                            "{field}"
                        </code>
                        {index < invalidFields.length - 1 && ", "}
                    </span>
                ))}
            </div>
            <div className="text-xs text-base-content/70 italic">
                💡 Use the autocomplete suggestions or check the model fields
            </div>
        </div>
    );
};

export const createRequiredFieldsErrorNotification = (
    missingFields: string[],
): JSX.Element => {
    const fieldCount = missingFields.length;
    const isPlural = fieldCount > 1;

    return (
        <div className="flex flex-col gap-2 text-sm text-base-content">
            <div className="font-semibold">
                <strong>
                    {isPlural
                        ? `${fieldCount} required fields missing:`
                        : "Required field missing:"}
                </strong>
            </div>
            <div className="flex flex-wrap gap-1">
                {missingFields.map((field, index) => (
                    <span key={field} className="inline-flex items-center">
                        <code className="rounded-sm bg-base-200 px-1.5 py-0.5 font-mono text-[11px] text-error">
                            "{field}"
                        </code>
                        {index < missingFields.length - 1 && ", "}
                    </span>
                ))}
            </div>
            <div className="text-xs text-base-content/70 italic">
                💡 These fields must be provided when creating a record
            </div>
        </div>
    );
};

export const generateDefaultFieldValue = (
    field: string,
    metadata?: FieldMetadata,
): unknown => {
    if (!metadata) {
        return "";
    }

    const fieldType = metadata.type;

    switch (fieldType) {
        case "char":
        case "text":
        case "html":
            return "";
        case "integer":
            return 0;
        case "float":
        case "monetary":
            return 0.0;
        case "boolean":
            return false;
        case "date":
            return new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
        case "datetime":
            return new Date().toISOString().slice(0, 19).replace("T", " "); // YYYY-MM-DD HH:MM:SS format
        case "selection":
            return ""; // Empty, user will need to choose
        case "many2one":
            return null; // Could be false or integer (id)
        case "many2many":
        case "one2many":
            return [];
        default:
            return "";
    }
};

export const generateRequiredFieldsTemplate = (
    missingFields: string[],
    fieldsMetadata: Record<string, FieldMetadata>,
): Record<string, unknown> => {
    const template: Record<string, unknown> = {};

    for (const field of missingFields) {
        const metadata = fieldsMetadata[field];
        template[field] = generateDefaultFieldValue(field, metadata);
    }

    return template;
};

export const createRequiredFieldsActionNotification = (
    missingFields: string[],
    onAddFields: () => void,
): {
    message: JSX.Element;
    actionButton: ActionButton;
} => {
    const fieldCount = missingFields.length;
    const isPlural = fieldCount > 1;

    const message = (
        <div className="flex flex-col gap-2 text-sm text-base-content">
            <div className="font-semibold">
                <strong>
                    {isPlural
                        ? `${fieldCount} required fields missing:`
                        : "Required field missing:"}
                </strong>
            </div>
            <div className="flex flex-wrap gap-1">
                {missingFields.map((field, index) => (
                    <span key={field} className="inline-flex items-center">
                        <code className="rounded-sm bg-base-200 px-1.5 py-0.5 font-mono text-[11px] text-error">
                            "{field}"
                        </code>
                        {index < missingFields.length - 1 && ", "}
                    </span>
                ))}
            </div>
            <div className="text-xs text-base-content/70 italic">
                💡 Click below to add these fields with default values
            </div>
        </div>
    );

    const actionButton: ActionButton = {
        label: isPlural ? "Add Required Fields" : "Add Required Field",
        variant: "secondary-outline",
        icon: "➕",
        action: onAddFields,
        autoClose: true,
    };

    return { message, actionButton };
};
