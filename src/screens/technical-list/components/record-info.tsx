import {
  CodeIcon,
  DatabaseIcon,
  EyeIcon,
  FilterIcon,
  IdIcon,
  Settings02Icon,
  StarIcon,
  ThreeDViewIcon,
  IdentificationIcon,
  ZapIcon,
} from "@hugeicons/core-free-icons";
import { Show } from "solid-js";

import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { t } from "@/utils/i18n-page";

import { useTechnicalSidebar } from "./hooks";
import { InfoItem } from "./info-item";
import { InfoSection } from "./info-section";
import { ModelActions } from "./model-actions";

export const RecordInfo = () => {
  const { viewInfo } = useTechnicalSidebar();

  return (
    <Show when={viewInfo()}>
      {(info) => (
        <InfoSection
          icon={
            <HugeiconsIcon icon={ThreeDViewIcon} size={16} color="currentColor" strokeWidth={1.6} />
          }
          title={t("technical_list.record_info.title")}
        >
          <Show when={info().currentModel}>
            <InfoItem
              icon={
                <HugeiconsIcon
                  icon={DatabaseIcon}
                  size={14}
                  color="currentColor"
                  strokeWidth={1.6}
                />
              }
              label={t("technical_list.record_info.model")}
              value={info().currentModel as string}
              copyable
            />
          </Show>
          <Show when={info().currentRecordId}>
            <InfoItem
              icon={
                <HugeiconsIcon icon={IdIcon} size={14} color="currentColor" strokeWidth={1.6} />
              }
              label={t("technical_list.record_info.record_id")}
              value={String(info().currentRecordId)}
              copyable
            />
          </Show>
          <Show when={info().viewType}>
            <InfoItem
              icon={
                <HugeiconsIcon icon={EyeIcon} size={14} color="currentColor" strokeWidth={1.6} />
              }
              label={t("technical_list.record_info.view_type")}
              value={info().viewType as string}
              copyable
            />
          </Show>
          <Show when={info().actionType}>
            <InfoItem
              icon={
                <HugeiconsIcon icon={ZapIcon} size={14} color="currentColor" strokeWidth={1.6} />
              }
              label={t("technical_list.record_info.action_type")}
              value={info().actionType as string}
              copyable
            />
          </Show>
          <Show when={info().actionName}>
            <InfoItem
              icon={
                <HugeiconsIcon icon={StarIcon} size={14} color="currentColor" strokeWidth={1.6} />
              }
              label={t("technical_list.record_info.action_name")}
              value={info().actionName as string}
              copyable
            />
          </Show>
          <Show when={info().actionId}>
            <InfoItem
              icon={
                <HugeiconsIcon
                  icon={IdentificationIcon}
                  size={14}
                  color="currentColor"
                  strokeWidth={1.6}
                />
              }
              label={t("technical_list.record_info.action_id")}
              value={String(info().actionId)}
              copyable
            />
          </Show>
          <Show when={info().actionXmlId}>
            <InfoItem
              icon={
                <HugeiconsIcon icon={CodeIcon} size={14} color="currentColor" strokeWidth={1.6} />
              }
              label={t("technical_list.record_info.action_xml_id")}
              value={info().actionXmlId as string}
              copyable
            />
          </Show>
          <Show when={info().actionContext}>
            <InfoItem
              icon={
                <HugeiconsIcon
                  icon={Settings02Icon}
                  size={14}
                  color="currentColor"
                  strokeWidth={1.6}
                />
              }
              label={t("technical_list.record_info.action_context")}
              value={info().actionContext as string}
              copyable
            />
          </Show>
          <Show when={info().actionDomain}>
            <InfoItem
              icon={
                <HugeiconsIcon icon={FilterIcon} size={14} color="currentColor" strokeWidth={1.6} />
              }
              label={t("technical_list.record_info.action_domain")}
              value={info().actionDomain as string}
              copyable
            />
          </Show>
          <Show when={info().currentModel}>
            {(currentModel) => (
              <ModelActions
                currentModel={currentModel()}
                currentRecordId={info().currentRecordId}
                actionType={info().actionType}
                actionId={info().actionId}
                viewType={info().viewType}
              />
            )}
          </Show>
        </InfoSection>
      )}
    </Show>
  );
};
