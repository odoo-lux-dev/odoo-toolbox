import { ComponentChildren, JSX } from "preact";
import { forwardRef } from "preact/compat";

type ButtonVariant = "solid" | "outline" | "dash" | "soft" | "ghost" | "link";
type ButtonColor =
    | "neutral"
    | "primary"
    | "secondary"
    | "accent"
    | "info"
    | "success"
    | "warning"
    | "error";
type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface ButtonProps
    extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, "size"> {
    variant?: ButtonVariant;
    color?: ButtonColor;
    size?: ButtonSize;
    wide?: boolean;
    block?: boolean;
    square?: boolean;
    circle?: boolean;
    active?: boolean;
    loading?: boolean;
    children?: ComponentChildren;
}

const variantClassMap: Record<ButtonVariant, string> = {
    solid: "",
    outline: "btn-outline",
    dash: "btn-dash",
    soft: "btn-soft",
    ghost: "btn-ghost",
    link: "btn-link",
};

const colorClassMap: Record<ButtonColor, string> = {
    neutral: "btn-neutral",
    primary: "btn-primary",
    secondary: "btn-secondary",
    accent: "btn-accent",
    info: "btn-info",
    success: "btn-success",
    warning: "btn-warning",
    error: "btn-error",
};

const sizeClassMap: Record<ButtonSize, string> = {
    xs: "btn-xs",
    sm: "btn-sm",
    md: "btn-md",
    lg: "btn-lg",
    xl: "btn-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = "solid",
            color,
            size = "md",
            wide = false,
            block = false,
            square = false,
            circle = false,
            active = false,
            loading = false,
            className,
            children,
            disabled,
            type = "button",
            ...rest
        },
        ref,
    ) => {
        const classes = [
            "btn",
            variantClassMap[variant],
            color ? colorClassMap[color] : "",
            size ? sizeClassMap[size] : "",
            wide ? "btn-wide" : "",
            block ? "btn-block" : "",
            square ? "btn-square" : "",
            circle ? "btn-circle" : "",
            active ? "btn-active" : "",
            loading ? "btn-disabled" : "",
            className ?? "",
        ]
            .filter(Boolean)
            .join(" ");

        return (
            <button
                ref={ref}
                className={classes}
                type={type}
                disabled={disabled || loading}
                aria-busy={loading || undefined}
                {...rest}
            >
                {loading ? (
                    <span className="loading loading-spinner loading-xs" />
                ) : null}
                {children}
            </button>
        );
    },
);
