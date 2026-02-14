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

const TEXTAREA_SIZE_CLASS: Record<TextareaSize, string> = {
    xs: "textarea-xs",
    sm: "textarea-sm",
    md: "textarea-md",
    lg: "textarea-lg",
    xl: "textarea-xl",
};

const TEXTAREA_COLOR_CLASS: Record<TextareaColor, string> = {
    neutral: "textarea-neutral",
    primary: "textarea-primary",
    secondary: "textarea-secondary",
    accent: "textarea-accent",
    info: "textarea-info",
    success: "textarea-success",
    warning: "textarea-warning",
    error: "textarea-error",
};

const TEXTAREA_VARIANT_CLASS: Record<TextareaStyle, string> = {
    ghost: "textarea-ghost",
};

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
    if (size) classes.push(TEXTAREA_SIZE_CLASS[size]);
    if (color) classes.push(TEXTAREA_COLOR_CLASS[color]);
    if (variant) classes.push(TEXTAREA_VARIANT_CLASS[variant]);
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
