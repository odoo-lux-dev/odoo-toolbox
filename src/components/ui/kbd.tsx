import { ComponentChildren, JSX } from "preact";

type KbdSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface KbdProps extends JSX.HTMLAttributes<HTMLElement> {
    size?: KbdSize;
    children: ComponentChildren;
}

const sizeClassMap: Record<KbdSize, string> = {
    xs: "kbd-xs",
    sm: "kbd-sm",
    md: "kbd-md",
    lg: "kbd-lg",
    xl: "kbd-xl",
};

const cx = (...classes: Array<string | undefined>) =>
    classes.filter(Boolean).join(" ");

export const Kbd = ({ size = "md", className, children, ...rest }: KbdProps) => {
    const classes = cx("kbd", size ? sizeClassMap[size] : undefined, className);

    return (
        <kbd className={classes} {...rest}>
            {children}
        </kbd>
    );
};
