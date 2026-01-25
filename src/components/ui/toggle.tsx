import { ComponentChildren, JSX } from "preact";
import { forwardRef } from "preact/compat";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Tick02Icon } from "@hugeicons/core-free-icons";

type ToggleColor =
    | "neutral"
    | "primary"
    | "secondary"
    | "accent"
    | "info"
    | "success"
    | "warning"
    | "error";

type ToggleSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface ToggleProps
    extends Omit<JSX.HTMLAttributes<HTMLInputElement>, "size"> {
    color?: ToggleColor;
    size?: ToggleSize;
    className?: string;
    withIcons?: boolean;
    iconOn?: ComponentChildren;
    iconOff?: ComponentChildren;
    iconClassName?: string;
    onCheckedChange?: (checked: boolean) => void;
    onChange?: JSX.GenericEventHandler<HTMLInputElement>;
}

const buildToggleClassName = (color?: ToggleColor, size?: ToggleSize) => {
    const classes = ["toggle"];
    if (color) {
        classes.push(`toggle-${color}`);
    }
    if (size) {
        classes.push(`toggle-${size}`);
    }
    return classes;
};

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
    (
        {
            color,
            size,
            className = "",
            withIcons = false,
            iconOn,
            iconOff,
            iconClassName,
            onChange,
            onCheckedChange,
            ...props
        },
        ref,
    ) => {
        const classes = buildToggleClassName(color, size);
        const combined = className
            ? `${classes.join(" ")} ${className}`
            : classes.join(" ");

        const handleChange = (event: Event) => {
            const target = event.currentTarget as HTMLInputElement;
            onCheckedChange?.(target.checked);
            onChange?.(event as JSX.TargetedEvent<HTMLInputElement, Event>);
        };

        if (withIcons || iconOn || iconOff) {
            const onIcon = iconOn ?? (
                <HugeiconsIcon
                    icon={Tick02Icon}
                    size={14}
                    color="currentColor"
                    strokeWidth={2}
                    className={iconClassName ?? "h-3.5 w-3.5"}
                />
            );

            const offIcon = iconOff ?? (
                <HugeiconsIcon
                    icon={Cancel01Icon}
                    size={14}
                    color="currentColor"
                    strokeWidth={2}
                    className={iconClassName ?? "h-3.5 w-3.5"}
                />
            );

            return (
                <label className={`${combined}`}>
                    <input
                        ref={ref}
                        type="checkbox"
                        onChange={handleChange}
                        {...props}
                    />
                    {offIcon}
                    {onIcon}
                </label>
            );
        }

        return (
            <input
                ref={ref}
                type="checkbox"
                className={combined}
                onChange={handleChange}
                {...props}
            />
        );
    },
);
