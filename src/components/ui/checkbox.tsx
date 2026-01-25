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

const buildCheckboxClassName = (color?: CheckboxColor, size?: CheckboxSize) => {
    const classes = ["checkbox"];
    if (color) classes.push(`checkbox-${color}`);
    if (size) classes.push(`checkbox-${size}`);
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
