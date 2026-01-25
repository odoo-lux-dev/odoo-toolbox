import { ComponentChildren, JSX } from "preact";

type TabsVariant = "boxed" | "bordered" | "lifted";
type TabsPlacement = "top" | "bottom";
type TabsSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface TabsProps extends JSX.HTMLAttributes<HTMLDivElement> {
    variant?: TabsVariant;
    placement?: TabsPlacement;
    size?: TabsSize;
    children: ComponentChildren;
}

export interface TabProps extends JSX.HTMLAttributes<HTMLButtonElement> {
    active?: boolean;
    disabled?: boolean;
    children: ComponentChildren;
}

const variantClassMap: Record<TabsVariant, string> = {
    boxed: "tabs-box",
    bordered: "tabs-border",
    lifted: "tabs-lift",
};

const placementClassMap: Record<TabsPlacement, string> = {
    top: "tabs-top",
    bottom: "tabs-bottom",
};

const sizeClassMap: Record<TabsSize, string> = {
    xs: "tabs-xs",
    sm: "tabs-sm",
    md: "tabs-md",
    lg: "tabs-lg",
    xl: "tabs-xl",
};

const cx = (...classes: Array<string | undefined>) =>
    classes.filter(Boolean).join(" ");

export const Tabs = ({
    variant,
    placement,
    size,
    className,
    children,
    ...rest
}: TabsProps) => {
    const classes = cx(
        "tabs",
        variant ? variantClassMap[variant] : undefined,
        placement ? placementClassMap[placement] : undefined,
        size ? sizeClassMap[size] : undefined,
        className,
    );

    return (
        <div role="tablist" className={classes} {...rest}>
            {children}
        </div>
    );
};

export const Tab = ({
    active = false,
    disabled = false,
    className,
    children,
    type = "button",
    ...rest
}: TabProps) => {
    const classes = cx(
        "tab",
        active ? "tab-active" : undefined,
        disabled ? "tab-disabled" : undefined,
        className,
    );

    return (
        <button
            role="tab"
            type={type}
            className={classes}
            aria-selected={active || undefined}
            aria-disabled={disabled || undefined}
            disabled={disabled}
            {...rest}
        >
            {children}
        </button>
    );
};
