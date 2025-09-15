import { useComputed } from "@preact/signals"
import { JSX } from "preact"
import {
    expandedSectionsSignal,
    setSectionExpanded,
    useTechnicalListSections,
} from "@/contexts/technical-list-signals"

interface InfoSectionProps {
    icon: string
    title: string
    children: JSX.Element | JSX.Element[] | (JSX.Element | null | false)[]
    defaultExpanded?: boolean
    sectionId?: string
}

export const InfoSection = ({
    icon,
    title,
    children,
    defaultExpanded = false,
    sectionId,
}: InfoSectionProps) => {
    const { toggleSectionExpanded } = useTechnicalListSections()

    const effectiveSectionId =
        sectionId || title.toLowerCase().replace(/\s+/g, "-")

    if (
        defaultExpanded &&
        !expandedSectionsSignal.value.has(effectiveSectionId)
    ) {
        setSectionExpanded(effectiveSectionId, true)
    }

    const isExpanded = useComputed(() =>
        expandedSectionsSignal.value.has(effectiveSectionId)
    )

    const toggleExpanded = () => {
        toggleSectionExpanded(effectiveSectionId)
    }

    return (
        <div className="x-odoo-technical-list-info-record-info">
            <div
                className="x-odoo-technical-list-info-section-header"
                onClick={toggleExpanded}
                title={
                    isExpanded.value ? "Click to collapse" : "Click to expand"
                }
            >
                <div className="x-odoo-technical-list-info-section-title">
                    <i className={`fa ${icon}`} />
                    <span>{title}</span>
                </div>
                <i
                    className={`fa fa-chevron-right x-odoo-technical-list-info-section-toggle ${isExpanded.value ? "x-odoo-technical-list-info-section-expanded" : ""}`}
                />
            </div>
            {isExpanded.value && (
                <div className="x-odoo-technical-list-info-section-content">
                    {children}
                </div>
            )}
        </div>
    )
}
