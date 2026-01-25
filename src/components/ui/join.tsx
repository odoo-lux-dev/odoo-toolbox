import { ComponentChildren, JSX } from "preact";

type JoinDirection = "horizontal" | "vertical";

export interface JoinProps extends JSX.HTMLAttributes<HTMLDivElement> {
    direction?: JoinDirection;
    children: ComponentChildren;
}

export interface JoinItemProps extends JSX.HTMLAttributes<HTMLDivElement> {
    children: ComponentChildren;
}

const directionClassMap: Record<JoinDirection, string> = {
    horizontal: "join-horizontal",
    vertical: "join-vertical",
};

const cx = (...classes: Array<string | undefined>) =>
    classes.filter(Boolean).join(" ");

export const Join = ({
    direction,
    className,
    children,
    ...rest
}: JoinProps) => {
    const classes = cx("join", direction ? directionClassMap[direction] : undefined, className);

    return (
        <div className={classes} {...rest}>
            {children}
        </div>
    );
};

export const JoinItem = ({ className, children, ...rest }: JoinItemProps) => {
    const classes = cx("join-item", className);

    return (
        <div className={classes} {...rest}>
            {children}
        </div>
    );
};
