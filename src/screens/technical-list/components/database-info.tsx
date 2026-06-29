import {
  Bug01Icon,
  Tag01Icon,
  DatabaseIcon,
  LanguageSkillIcon,
  Settings02Icon,
} from "@hugeicons/core-free-icons";

import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { DatabaseInfo } from "@/types";
import { t } from "@/utils/i18n-page";

import { InfoItem } from "./info-item";
import { InfoSection } from "./info-section";

interface DatabaseInfoComponentProps {
  dbInfo: DatabaseInfo;
}

export const DatabaseInfoComponent = (props: DatabaseInfoComponentProps) => {
  return (
    <InfoSection
      icon={<HugeiconsIcon icon={DatabaseIcon} size={16} color="currentColor" strokeWidth={1.6} />}
      title={t("technical_list.database_info.title")}
    >
      <InfoItem
        icon={<HugeiconsIcon icon={Tag01Icon} size={14} color="currentColor" strokeWidth={1.6} />}
        label={t("technical_list.database_info.version")}
        value={props.dbInfo.version}
        copyable={true}
      />
      <InfoItem
        icon={
          <HugeiconsIcon icon={DatabaseIcon} size={14} color="currentColor" strokeWidth={1.6} />
        }
        label={t("technical_list.database_info.database")}
        value={props.dbInfo.database}
        copyable={true}
      />
      <InfoItem
        icon={
          <HugeiconsIcon icon={Settings02Icon} size={14} color="currentColor" strokeWidth={1.6} />
        }
        label={t("technical_list.database_info.server_info")}
        value={props.dbInfo.serverInfo}
        copyable={true}
      />
      <InfoItem
        icon={
          <HugeiconsIcon
            icon={LanguageSkillIcon}
            size={14}
            color="currentColor"
            strokeWidth={1.6}
          />
        }
        label={t("technical_list.database_info.language")}
        value={props.dbInfo.language}
        copyable={true}
      />
      <InfoItem
        icon={<HugeiconsIcon icon={Bug01Icon} size={14} color="currentColor" strokeWidth={1.6} />}
        label={t("technical_list.database_info.debug_mode")}
        value={props.dbInfo.debugMode}
        valueClass={`${props.dbInfo.debugMode === "Disabled" ? "text-error" : "text-success"} font-semibold`}
        copyable={false}
      />
    </InfoSection>
  );
};
