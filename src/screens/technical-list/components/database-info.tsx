import { DatabaseIcon } from "@hugeicons/core-free-icons";

import { t } from "@/utils/i18n-page";

import type { DatabaseInfo, DebugMode } from "../types";
import { InfoSection } from "./info-section";

const DEBUG_MODE_LABELS: Record<DebugMode, () => string> = {
  disabled: () => t("technical_list.debug_mode.disabled"),
  enabled: () => t("technical_list.debug_mode.enabled"),
  assets: () => t("technical_list.debug_mode.assets"),
  tests: () => t("technical_list.debug_mode.tests"),
};

export const DatabaseInfoSection = (props: { dbInfo: DatabaseInfo }) => {
  const unknown = () => t("technical_list.debug_mode.unknown");
  return (
    <InfoSection
      icon={DatabaseIcon}
      title={t("technical_list.database_info.title")}
      collapseId="database"
      rows={[
        {
          label: t("technical_list.database_info.version"),
          value: props.dbInfo.version ?? unknown(),
        },
        {
          label: t("technical_list.database_info.database"),
          value: props.dbInfo.database ?? unknown(),
        },
        {
          label: t("technical_list.database_info.server_info"),
          value: props.dbInfo.serverInfo ?? unknown(),
        },
        {
          label: t("technical_list.database_info.language"),
          value: props.dbInfo.language ?? unknown(),
        },
        {
          label: t("technical_list.database_info.debug_mode"),
          value: DEBUG_MODE_LABELS[props.dbInfo.debugMode](),
          copyable: false,
          valueClass: `${props.dbInfo.debugMode === "disabled" ? "text-error-ink" : "text-success-ink"} font-medium`,
        },
      ]}
    />
  );
};
