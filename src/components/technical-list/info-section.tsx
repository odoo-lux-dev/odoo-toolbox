import { useComputed } from "@preact/signals";
import { ComponentChildren, JSX } from "preact";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import {
    expandedSectionsSignal,
    setSectionExpanded,
    useTechnicalListSections,
} from "@/contexts/technical-list-signals";

interface InfoSectionProps {
    icon: ComponentChildren;
    title: string;
    children: JSX.Element | JSX.Element[] | (JSX.Element | null | false)[];
    defaultExpanded?: boolean;
    sectionId?: string;
}

export const InfoSection = ({
    icon,
    title,
    children,
    defaultExpanded = false,
    sectionId,
}: InfoSectionProps) => {
    const { toggleSectionExpanded } = useTechnicalListSections();

    const effectiveSectionId =
        sectionId || title.toLowerCase().replace(/\s+/g, "-");

    if (
        defaultExpanded &&
        !expandedSectionsSignal.value.has(effectiveSectionId)
    ) {
        setSectionExpanded(effectiveSectionId, true);
    }

    const isExpanded = useComputed(() =>
        expandedSectionsSignal.value.has(effectiveSectionId),
    );

    const toggleExpanded = () => {
        toggleSectionExpanded(effectiveSectionId);
    };

    return (
        <div className="border-b border-solid border-base-100 px-2 py-4 dark:border-base-200">
            <button
                type="button"
                onClick={toggleExpanded}
                aria-expanded={isExpanded.value}
                className="flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-base font-semibold text-base-content transition-colors hover:bg-base-200/60"
                title={
                    isExpanded.value ? "Click to collapse" : "Click to expand"
                }
            >
                <div className="flex items-center gap-2">
                    <span className="text-base opacity-70">{icon}</span>
                    <span>{title}</span>
                </div>
                <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    size={14}
                    color="currentColor"
                    strokeWidth={1.6}
                    className={`transition-transform duration-200 ${
                        isExpanded.value ? "rotate-90" : ""
                    }`}
                />
            </button>
            {isExpanded.value && <div className="mt-3">{children}</div>}
        </div>
    );
};
