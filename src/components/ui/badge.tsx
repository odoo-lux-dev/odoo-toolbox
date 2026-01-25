import { ComponentChildren, JSX } from "preact";

type BadgeVariant = "solid" | "outline";
type BadgeColor =
    | "neutral"
    | "primary"
    | "secondary"
    | "accent"
    | "info"
    | "success"
    | "warning"
    | "error";
type BadgeSize = "xs" | "sm" | "md" | "lg";

export interface BadgeProps extends JSX.HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
    color?: BadgeColor;
    size?: BadgeSize;
    children?: ComponentChildren;
}

const variantClassMap: Record<BadgeVariant, string> = {
    solid: "",
    outline: "badge-outline",
};

const colorClassMap: Record<BadgeColor, string> = {
    neutral: "badge-neutral",
    primary: "badge-primary",
    secondary: "badge-secondary",
    accent: "badge-accent",
    info: "badge-info",
    success: "badge-success",
    warning: "badge-warning",
    error: "badge-error",
};

const sizeClassMap: Record<BadgeSize, string> = {
    xs: "badge-xs",
    sm: "badge-sm",
    md: "badge-md",
    lg: "badge-lg",
};

const cx = (...classes: Array<string | undefined>) =>
    classes.filter(Boolean).join(" ");

export const Badge = ({
    variant = "solid",
    color,
    size = "md",
    className,
    children,
    ...rest
}: BadgeProps) => {
    const classes = cx(
        "badge",
        variantClassMap[variant],
        color ? colorClassMap[color] : undefined,
        size ? sizeClassMap[size] : undefined,
        className,
    );

    return (
        <span className={classes} {...rest}>
            {children}
        </span>
    );
};
