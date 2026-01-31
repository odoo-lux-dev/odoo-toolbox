import { ComponentChildren } from "preact";
import { Card } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/info-tooltip";

interface OptionItemProps {
    id: string;
    title: string;
    description?: string;
    tooltipContent?: ComponentChildren;
    additionalTooltipContent?: ComponentChildren;
    children: ComponentChildren;
    className?: string;
}

export const OptionItem = ({
    id,
    title,
    description,
    tooltipContent,
    additionalTooltipContent,
    children,
    className = "",
}: OptionItemProps) => {
    return (
        <Card
            id={id}
            className={`break-inside-avoid self-start bg-base-100 shadow-sm ${className}`}
            bodyClassName="gap-2"
        >
            <div className="flex items-start justify-between gap-2">
                <h3 className="card-title text-base">{title}</h3>
                {tooltipContent ? (
                    <InfoTooltip
                        content={tooltipContent}
                        additionalContent={additionalTooltipContent}
                        placement="left"
                    />
                ) : null}
            </div>
            {description ? (
                <p className="text-sm opacity-80">{description}</p>
            ) : null}
            <div className="mt-2 flex flex-col gap-2">{children}</div>
        </Card>
    );
};
