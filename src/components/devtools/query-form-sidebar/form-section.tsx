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
    const sectionClasses = `form-section${className ? ` ${className}` : ""}`;

    return (
        <div className={sectionClasses}>
            {label && (
                <label className="form-label">
                    {label} {required && <span className="required">*</span>}
                    {helpText && (
                        <span
                            className={`help-text${helpTextWarning ? " warning" : ""}`}
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
