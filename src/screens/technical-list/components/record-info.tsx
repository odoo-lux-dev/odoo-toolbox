import { ThreeDViewIcon } from "@hugeicons/core-free-icons";

import { t } from "@/utils/i18n-page";

import type { ControllerInfo } from "../types";
import { InfoSection } from "./info-section";
import { ModelActions } from "./model-actions";

export const RecordInfoSection = (props: { model: string; info: ControllerInfo }) => (
  <InfoSection
    icon={ThreeDViewIcon}
    title={t("technical_list.record_info.title")}
    collapseId="record"
    rows={[
      { label: t("technical_list.record_info.model"), value: props.model },
      { label: t("technical_list.record_info.record_id"), value: props.info.currentRecordId },
      { label: t("technical_list.record_info.view_type"), value: props.info.viewType },
      { label: t("technical_list.record_info.action_type"), value: props.info.actionType },
      { label: t("technical_list.record_info.action_name"), value: props.info.actionName },
      { label: t("technical_list.record_info.action_id"), value: props.info.actionId },
      { label: t("technical_list.record_info.action_xml_id"), value: props.info.actionXmlId },
      { label: t("technical_list.record_info.action_context"), value: props.info.actionContext },
      { label: t("technical_list.record_info.action_domain"), value: props.info.actionDomain },
    ]}
    footer={<ModelActions model={props.model} info={props.info} />}
  />
);
