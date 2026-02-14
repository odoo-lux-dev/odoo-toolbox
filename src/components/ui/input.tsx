import { ComponentChildren } from "preact";
import { forwardRef } from "preact/compat";
import { JSX } from "preact/jsx-runtime";

type InputSize = "xs" | "sm" | "md" | "lg" | "xl";
type InputColor =
    | "neutral"
    | "primary"
    | "secondary"
    | "accent"
    | "info"
    | "success"
    | "warning"
    | "error";
type InputStyle = "ghost";

interface InputProps
    extends Omit<JSX.InputHTMLAttributes<HTMLInputElement>, "size"> {
    size?: InputSize;
    color?: InputColor;
    variant?: InputStyle;
    fullWidth?: boolean;
    prefix?: ComponentChildren;
    suffix?: ComponentChildren;
}

const INPUT_SIZE_CLASS: Record<InputSize, string> = {
    xs: "input-xs",
    sm: "input-sm",
    md: "input-md",
    lg: "input-lg",
    xl: "input-xl",
};

const INPUT_COLOR_CLASS: Record<InputColor, string> = {
    neutral: "input-neutral",
    primary: "input-primary",
    secondary: "input-secondary",
    accent: "input-accent",
    info: "input-info",
    success: "input-success",
    warning: "input-warning",
    error: "input-error",
};

const INPUT_VARIANT_CLASS: Record<InputStyle, string> = {
    ghost: "input-ghost",
};

const buildInputClassName = ({
    size,
    color,
    variant,
    fullWidth,
    className,
}: {
    size?: InputSize;
    color?: InputColor;
    variant?: InputStyle;
    fullWidth?: boolean;
    className?: string;
}) => {
    const classes = ["input"];
    if (size) classes.push(INPUT_SIZE_CLASS[size]);
    if (color) classes.push(INPUT_COLOR_CLASS[color]);
    if (variant) classes.push(INPUT_VARIANT_CLASS[variant]);
    if (fullWidth) classes.push("w-full");
    if (className) classes.push(className);
    return classes.join(" ");
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            size,
            color,
            variant,
            fullWidth,
            prefix,
            suffix,
            className,
            type = "text",
            ...props
        },
        ref,
    ) => {
        const inputClassName = buildInputClassName({
            size,
            color,
            variant,
            fullWidth,
            className,
        });

        if (prefix || suffix) {
            return (
                <label className={inputClassName}>
                    {prefix ? <span className="label">{prefix}</span> : null}
                    <input ref={ref} type={type} {...props} />
                    {suffix ? <span className="label">{suffix}</span> : null}
                </label>
            );
        }

        return (
            <input
                ref={ref}
                className={inputClassName}
                type={type}
                {...props}
            />
        );
    },
);
