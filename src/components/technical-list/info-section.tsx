import { JSX } from "preact"
import { useTechnicalListSections } from "@/contexts/technical-list-signals-hook"

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
    const { isSectionExpanded, toggleSectionExpanded, setSectionExpanded } = useTechnicalListSections()

    // Use signal-based state if sectionId is provided, otherwise use default
    const isExpanded = sectionId ? isSectionExpanded(sectionId) : defaultExpanded

    const toggleExpanded = () => {
        if (sectionId) {
            toggleSectionExpanded(sectionId)
        } else {
            // Fallback for sections without IDs - initialize with sectionId based on title
            const fallbackId = title.toLowerCase().replace(/\s+/g, '-')
            setSectionExpanded(fallbackId, !isExpanded)
        }
    }

    return (
        <div className="x-odoo-technical-list-info-record-info">
            <div
                className="x-odoo-technical-list-info-section-header"
                onClick={toggleExpanded}
                title={isExpanded ? "Click to collapse" : "Click to expand"}
            >
                <div className="x-odoo-technical-list-info-section-title">
                    <i className={`fa ${icon}`} />
                    <span>{title}</span>
                </div>
                <i
                    className={`fa fa-chevron-right x-odoo-technical-list-info-section-toggle ${isExpanded ? "x-odoo-technical-list-info-section-expanded" : ""}`}
                />
            </div>
            {isExpanded && (
                <div className="x-odoo-technical-list-info-section-content">
                    {children}
                </div>
            )}
        </div>
    )
}
