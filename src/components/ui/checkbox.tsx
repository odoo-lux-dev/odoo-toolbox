import { ComponentChildren, JSX } from "preact";
import { forwardRef } from "preact/compat";

type CheckboxColor =
    | "neutral"
    | "primary"
    | "secondary"
    | "accent"
    | "info"
    | "success"
    | "warning"
    | "error";

type CheckboxSize = "xs" | "sm" | "md" | "lg";

export interface CheckboxProps
    extends Omit<JSX.HTMLAttributes<HTMLInputElement>, "size"> {
    color?: CheckboxColor;
    size?: CheckboxSize;
    className?: string;
    label?: ComponentChildren;
    onCheckedChange?: (checked: boolean) => void;
    onChange?: JSX.GenericEventHandler<HTMLInputElement>;
}

const CHECKBOX_COLOR_CLASS: Record<CheckboxColor, string> = {
    neutral: "checkbox-neutral",
    primary: "checkbox-primary",
    secondary: "checkbox-secondary",
    accent: "checkbox-accent",
    info: "checkbox-info",
    success: "checkbox-success",
    warning: "checkbox-warning",
    error: "checkbox-error",
};

const CHECKBOX_SIZE_CLASS: Record<CheckboxSize, string> = {
    xs: "checkbox-xs",
    sm: "checkbox-sm",
    md: "checkbox-md",
    lg: "checkbox-lg",
};

const buildCheckboxClassName = (color?: CheckboxColor, size?: CheckboxSize) => {
    const classes = ["checkbox"];
    if (color) classes.push(CHECKBOX_COLOR_CLASS[color]);
    if (size) classes.push(CHECKBOX_SIZE_CLASS[size]);
    return classes.join(" ");
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
    (
        { color, size, className, label, onCheckedChange, onChange, ...props },
        ref,
    ) => {
        const classes = buildCheckboxClassName(color, size);
        const combined = className ? `${classes} ${className}` : classes;

        const handleChange = (event: Event) => {
            const target = event.currentTarget as HTMLInputElement;
            onCheckedChange?.(target.checked);
            onChange?.(event as JSX.TargetedEvent<HTMLInputElement, Event>);
        };

        if (label !== undefined) {
            return (
                <label className="label cursor-pointer gap-2">
                    <input
                        ref={ref}
                        type="checkbox"
                        className={combined}
                        onChange={handleChange}
                        {...props}
                    />
                    <span className="label-text">{label}</span>
                </label>
            );
        }

        return (
            <input
                ref={ref}
                type="checkbox"
                className={combined}
                onChange={handleChange}
                {...props}
            />
        );
    },
);
