import { ComponentChildren, JSX } from "preact";
import { forwardRef } from "preact/compat";

type IconButtonVariant =
    | "solid"
    | "outline"
    | "dash"
    | "soft"
    | "ghost"
    | "link";
type IconButtonColor =
    | "neutral"
    | "primary"
    | "secondary"
    | "accent"
    | "info"
    | "success"
    | "warning"
    | "error";
type IconButtonSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface IconButtonProps
    extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, "size"> {
    icon: ComponentChildren;
    label: string;
    variant?: IconButtonVariant;
    color?: IconButtonColor;
    size?: IconButtonSize;
    circle?: boolean;
    square?: boolean;
    active?: boolean;
    loading?: boolean;
}

const variantClassMap: Record<IconButtonVariant, string> = {
    solid: "",
    outline: "btn-outline",
    dash: "btn-dash",
    soft: "btn-soft",
    ghost: "btn-ghost",
    link: "btn-link",
};

const colorClassMap: Record<IconButtonColor, string> = {
    neutral: "btn-neutral",
    primary: "btn-primary",
    secondary: "btn-secondary",
    accent: "btn-accent",
    info: "btn-info",
    success: "btn-success",
    warning: "btn-warning",
    error: "btn-error",
};

const sizeClassMap: Record<IconButtonSize, string> = {
    xs: "btn-xs",
    sm: "btn-sm",
    md: "btn-md",
    lg: "btn-lg",
    xl: "btn-xl",
};

const cx = (...classes: Array<string | undefined>) =>
    classes.filter(Boolean).join(" ");

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
    (
        {
            icon,
            label,
            variant = "solid",
            color,
            size = "md",
            circle = true,
            square = false,
            active = false,
            loading = false,
            className,
            disabled,
            type = "button",
            ...rest
        },
        ref,
    ) => {
        const shapeClass = square
            ? "btn-square"
            : circle
              ? "btn-circle"
              : undefined;
        const classes = cx(
            "btn",
            variantClassMap[variant],
            color ? colorClassMap[color] : undefined,
            size ? sizeClassMap[size] : undefined,
            shapeClass,
            active ? "btn-active" : undefined,
            loading || disabled ? "btn-disabled" : undefined,
            className,
        );

        return (
            <button
                ref={ref}
                type={type}
                className={classes}
                aria-label={label}
                title={label}
                disabled={disabled || loading}
                aria-busy={loading || undefined}
                {...rest}
            >
                {loading ? (
                    <span className="loading loading-spinner loading-xs" />
                ) : null}
                {icon}
            </button>
        );
    },
);
