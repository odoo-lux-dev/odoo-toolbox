import { ComponentChildren } from "preact";

type HelpTone = "neutral" | "warning" | "error" | "success" | "info";

export interface FormFieldProps {
    label?: ComponentChildren;
    required?: boolean;
    helpText?: ComponentChildren;
    helpTone?: HelpTone;
    className?: string;
    children: ComponentChildren;
}

const helpToneClassMap: Record<HelpTone, string> = {
    neutral: "text-base-content/70",
    warning: "text-warning",
    error: "text-error",
    success: "text-success",
    info: "text-info",
};

const cx = (...classes: Array<string | undefined>) =>
    classes.filter(Boolean).join(" ");

export const FormField = ({
    label,
    required = false,
    helpText,
    helpTone = "neutral",
    className,
    children,
}: FormFieldProps) => {
    return (
        <div className={cx("flex flex-col gap-2", className)}>
            {label ? (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1 text-sm font-medium">
                        <span>{label}</span>
                        {required ? (
                            <span className="text-error" aria-hidden="true">
                                *
                            </span>
                        ) : null}
                    </div>
                    {helpText ? (
                        <span className={cx("text-xs", helpToneClassMap[helpTone])}>
                            {helpText}
                        </span>
                    ) : null}
                </div>
            ) : null}
            {children}
        </div>
    );
};
