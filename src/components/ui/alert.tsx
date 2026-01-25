import { ComponentChildren, JSX } from "preact";

type AlertStyle = "outline" | "dash" | "soft";
type AlertColor = "info" | "success" | "warning" | "error";
type AlertDirection = "vertical" | "horizontal";

export interface AlertProps extends JSX.HTMLAttributes<HTMLDivElement> {
    title?: ComponentChildren;
    icon?: ComponentChildren;
    actions?: ComponentChildren;
    variant?: AlertStyle;
    color?: AlertColor;
    direction?: AlertDirection;
    children?: ComponentChildren;
}

const styleClassMap: Record<AlertStyle, string> = {
    outline: "alert-outline",
    dash: "alert-dash",
    soft: "alert-soft",
};

const colorClassMap: Record<AlertColor, string> = {
    info: "alert-info",
    success: "alert-success",
    warning: "alert-warning",
    error: "alert-error",
};

const directionClassMap: Record<AlertDirection, string> = {
    vertical: "alert-vertical",
    horizontal: "alert-horizontal",
};

const cx = (...classes: Array<string | undefined>) =>
    classes.filter(Boolean).join(" ");

export const Alert = ({
    title,
    icon,
    actions,
    variant,
    color,
    direction,
    className,
    children,
    ...rest
}: AlertProps) => {
    const alertClassName = cx(
        "alert",
        variant ? styleClassMap[variant] : undefined,
        color ? colorClassMap[color] : undefined,
        direction ? directionClassMap[direction] : undefined,
        className,
    );

    return (
        <div role="alert" className={alertClassName} {...rest}>
            {icon ? <div>{icon}</div> : null}
            <div className="flex flex-col gap-1">
                {title ? <h3 className="font-semibold">{title}</h3> : null}
                {children}
            </div>
            {actions ? <div className="alert-actions">{actions}</div> : null}
        </div>
    );
};
