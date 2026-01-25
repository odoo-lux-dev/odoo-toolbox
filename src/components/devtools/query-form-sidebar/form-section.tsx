import { ComponentChildren } from "preact";

interface FormSectionProps {
    label?: string;
    /** Indicates if the field is required (adds a red asterisk) */
    required?: boolean;
    /** Help text below the label */
    helpText?: string;
    /** Indicates if the help text is a warning (orange color) */
    helpTextWarning?: boolean;
    className?: string;
    children: ComponentChildren;
}

export const FormSection = ({
    label,
    required = false,
    helpText,
    helpTextWarning = false,
    className = "",
    children,
}: FormSectionProps) => {
    return (
        <div className={`mb-3 ${className}`.trim()}>
            {label && (
                <label className="block text-sm font-medium text-base-content">
                    {label} {required && <span className="text-error">*</span>}
                    {helpText && (
                        <span
                            className={`mt-1 block text-xs ${helpTextWarning ? "text-warning" : "text-base-content/60"}`}
                        >
                            {helpText}
                        </span>
                    )}
                </label>
            )}
            {children}
        </div>
    );
};
