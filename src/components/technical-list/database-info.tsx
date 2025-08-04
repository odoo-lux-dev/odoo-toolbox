import { InfoItem } from "./info-item"
import { InfoSection } from "./info-section"
import { DatabaseInfo } from "@/utils/types"

interface DatabaseInfoComponentProps {
  dbInfo: DatabaseInfo
}

export const DatabaseInfoComponent = ({
  dbInfo,
}: DatabaseInfoComponentProps) => {
  const items = [
    <InfoItem
      icon="fa-tag"
      label="Version"
      value={dbInfo.version}
      copyable={true}
    />,
    <InfoItem
      icon="fa-database"
      label="Database"
      value={dbInfo.database}
      copyable={true}
    />,
    <InfoItem
      icon="fa-server"
      label="Server Info"
      value={dbInfo.serverInfo}
      copyable={true}
    />,
    <InfoItem
      icon="fa-language"
      label="Language"
      value={dbInfo.language}
      copyable={true}
    />,
    <InfoItem
      icon="fa-bug"
      label="Debug Mode"
      value={dbInfo.debugMode}
      valueClass="x-odoo-debug-active"
      copyable={false}
    />,
  ]

  return (
    <InfoSection icon="fa-database" title="Database Information">
      {items}
    </InfoSection>
  )
}
