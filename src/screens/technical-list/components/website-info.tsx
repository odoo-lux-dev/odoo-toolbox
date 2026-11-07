import { WebDesign01Icon } from "@hugeicons/core-free-icons";
import { Show } from "solid-js";

import { t } from "@/utils/i18n-page";

import type { WebsiteInfo } from "../types";
import { InfoSection } from "./info-section";
import { TechnicalBadge } from "./technical-card";

export const WebsiteInfoSection = (props: { websiteInfo: WebsiteInfo }) => (
  <InfoSection
    icon={WebDesign01Icon}
    title={t("technical_list.website_info.title")}
    rows={[
      { label: t("technical_list.website_info.website_id"), value: props.websiteInfo.websiteId },
      { label: t("technical_list.website_info.main_object"), value: props.websiteInfo.mainObject },
      { label: t("technical_list.website_info.view_xml_id"), value: props.websiteInfo.viewXmlId },
      { label: t("technical_list.website_info.view_id"), value: props.websiteInfo.viewId },
    ]}
    aside={
      <>
        <TechnicalBadge tone={props.websiteInfo.isLogged ? "success" : "warning"}>
          {props.websiteInfo.isLogged
            ? t("technical_list.website_info.logged_in")
            : t("technical_list.website_info.public")}
        </TechnicalBadge>
        <Show when={props.websiteInfo.language}>
          <TechnicalBadge tone="info">{props.websiteInfo.language}</TechnicalBadge>
        </Show>
      </>
    }
  />
);
