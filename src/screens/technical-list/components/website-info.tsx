import {
  CodeIcon,
  GlobeIcon,
  HashtagIcon,
  AlignKeyObjectIcon,
  WebDesign01Icon,
} from "@hugeicons/core-free-icons";
import { Show } from "solid-js";

import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { WebsiteInfo as WebsiteInfoType } from "@/types";
import { t } from "@/utils/i18n-page";

import { InfoItem } from "./info-item";

interface WebsiteInfoProps {
  websiteInfo: WebsiteInfoType;
}

export const WebsiteInfo = (props: WebsiteInfoProps) => {
  return (
    <div class="space-y-4 px-6 py-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2 text-base font-semibold text-base-content">
          <HugeiconsIcon icon={WebDesign01Icon} size={16} color="currentColor" strokeWidth={1.6} />
          <span>{t("technical_list.website_info.title")}</span>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <Badge
            color={props.websiteInfo.isLogged ? "success" : "warning"}
            size="sm"
            variant="outline"
          >
            {props.websiteInfo.isLogged
              ? t("technical_list.website_info.logged_in")
              : t("technical_list.website_info.public")}
          </Badge>
          <Show when={props.websiteInfo.language}>
            <Badge color="info" size="sm" variant="outline">
              {props.websiteInfo.language}
            </Badge>
          </Show>
        </div>
      </div>

      <div>
        <InfoItem
          icon={<HugeiconsIcon icon={GlobeIcon} size={14} color="currentColor" strokeWidth={1.6} />}
          label={t("technical_list.website_info.website_id")}
          value={props.websiteInfo.websiteId}
          copyable={true}
        />
        <InfoItem
          icon={
            <HugeiconsIcon
              icon={AlignKeyObjectIcon}
              size={14}
              color="currentColor"
              strokeWidth={1.6}
            />
          }
          label={t("technical_list.website_info.main_object")}
          value={props.websiteInfo.mainObject}
          copyable={true}
        />
        <Show when={props.websiteInfo.viewXmlId}>
          <InfoItem
            icon={
              <HugeiconsIcon icon={CodeIcon} size={14} color="currentColor" strokeWidth={1.6} />
            }
            label={t("technical_list.website_info.view_xml_id")}
            value={props.websiteInfo.viewXmlId as string}
            copyable={true}
          />
        </Show>
        <Show when={props.websiteInfo.viewId}>
          <InfoItem
            icon={
              <HugeiconsIcon icon={HashtagIcon} size={14} color="currentColor" strokeWidth={1.6} />
            }
            label={t("technical_list.website_info.view_id")}
            value={props.websiteInfo.viewId as string}
            copyable={true}
          />
        </Show>
      </div>
    </div>
  );
};
