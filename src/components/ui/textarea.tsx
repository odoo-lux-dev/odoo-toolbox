import { forwardRef } from "preact/compat";
import { JSX } from "preact/jsx-runtime";

type TextareaSize = "xs" | "sm" | "md" | "lg" | "xl";
type TextareaColor =
    | "neutral"
    | "primary"
    | "secondary"
    | "accent"
    | "info"
    | "success"
    | "warning"
    | "error";
type TextareaStyle = "ghost";

export interface TextareaProps
    extends Omit<JSX.TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> {
    size?: TextareaSize;
    color?: TextareaColor;
    variant?: TextareaStyle;
    fullWidth?: boolean;
}

const buildTextareaClassName = ({
    size,
    color,
    variant,
    fullWidth,
    className,
}: {
    size?: TextareaSize;
    color?: TextareaColor;
    variant?: TextareaStyle;
    fullWidth?: boolean;
    className?: string;
}) => {
    const classes = ["textarea"];
    if (size) classes.push(`textarea-${size}`);
    if (color) classes.push(`textarea-${color}`);
    if (variant) classes.push(`textarea-${variant}`);
    if (fullWidth) classes.push("w-full");
    if (className) classes.push(className);
    return classes.join(" ");
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ size, color, variant, fullWidth, className, ...props }, ref) => {
        const textareaClassName = buildTextareaClassName({
            size,
            color,
            variant,
            fullWidth,
            className,
        });

        return <textarea ref={ref} className={textareaClassName} {...props} />;
    },
);
