import { JSX } from "preact"
import { useState } from "preact/hooks"

interface InfoSectionProps {
  icon: string
  title: string
  children: JSX.Element | JSX.Element[] | (JSX.Element | null | false)[]
  defaultExpanded?: boolean
}

export const InfoSection = ({
  icon,
  title,
  children,
  defaultExpanded = false,
}: InfoSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
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
