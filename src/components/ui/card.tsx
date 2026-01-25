import { ComponentChildren, JSX } from "preact";

type CardSize = "xs" | "sm" | "md" | "lg" | "xl";
type CardStyle = "border" | "dash";
type CardLayout = "side" | "image-full";

export interface CardProps
    extends Omit<JSX.HTMLAttributes<HTMLDivElement>, "title"> {
    title?: ComponentChildren;
    actions?: ComponentChildren;
    size?: CardSize;
    variant?: CardStyle;
    layout?: CardLayout;
    bodyClassName?: string;
    children?: ComponentChildren;
}

const sizeClassMap: Record<CardSize, string> = {
    xs: "card-xs",
    sm: "card-sm",
    md: "card-md",
    lg: "card-lg",
    xl: "card-xl",
};

const styleClassMap: Record<CardStyle, string> = {
    border: "card-border",
    dash: "card-dash",
};

const layoutClassMap: Record<CardLayout, string> = {
    side: "card-side",
    "image-full": "image-full",
};

const cx = (...classes: Array<string | undefined>) =>
    classes.filter(Boolean).join(" ");

export const Card = ({
    title,
    actions,
    size,
    variant,
    layout,
    className,
    bodyClassName,
    children,
    ...rest
}: CardProps) => {
    const cardClassName = cx(
        "card",
        size ? sizeClassMap[size] : undefined,
        variant ? styleClassMap[variant] : undefined,
        layout ? layoutClassMap[layout] : undefined,
        className,
    );

    return (
        <div className={cardClassName} {...rest}>
            <div className={cx("card-body", bodyClassName)}>
                {title ? <h2 className="card-title">{title}</h2> : null}
                {children}
                {actions ? <div className="card-actions">{actions}</div> : null}
            </div>
        </div>
    );
};
