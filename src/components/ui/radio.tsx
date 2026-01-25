import { ComponentChildren, JSX } from "preact";
import { forwardRef } from "preact/compat";

type RadioColor =
    | "neutral"
    | "primary"
    | "secondary"
    | "accent"
    | "info"
    | "success"
    | "warning"
    | "error";

type RadioSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface RadioProps
    extends Omit<JSX.HTMLAttributes<HTMLInputElement>, "size"> {
    label?: ComponentChildren;
    color?: RadioColor;
    size?: RadioSize;
    labelClassName?: string;
}

const buildRadioClassName = (color?: RadioColor, size?: RadioSize) => {
    const classes = ["radio"];
    if (color) {
        classes.push(`radio-${color}`);
    }
    if (size) {
        classes.push(`radio-${size}`);
    }
    return classes;
};

const cx = (...classes: Array<string | undefined>) =>
    classes.filter(Boolean).join(" ");

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
    (
        {
            label,
            color = "primary",
            size,
            className,
            labelClassName = "label-text",
            ...props
        },
        ref,
    ) => {
        const radioClasses = cx(...buildRadioClassName(color, size), className);

        if (label) {
            return (
                <label className="label cursor-pointer items-center justify-start gap-3">
                    <input
                        ref={ref}
                        type="radio"
                        className={radioClasses}
                        {...props}
                    />
                    <span className={labelClassName}>{label}</span>
                </label>
            );
        }

        return (
            <input ref={ref} type="radio" className={radioClasses} {...props} />
        );
    },
);
