import { ComponentChildren } from "preact";

export interface TooltipProps {
    tip: string;
    children: ComponentChildren;
    className?: string;
}

const cx = (...classes: Array<string | undefined>) =>
    classes.filter(Boolean).join(" ");

export const Tooltip = ({ tip, children, className }: TooltipProps) => {
    return (
        <div className={cx("tooltip", className)} data-tip={tip}>
            <div>{children}</div>
        </div>
    );
};
