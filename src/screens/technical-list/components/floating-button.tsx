import { SourceCodeIcon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { daisyThemeName } from "@/theme/themes";
import { t } from "@/utils/i18n-page";
import { readDatasetSetting } from "@/utils/settings-schema";

import { useSidebar } from "../sidebar-store";
import { TECHNICAL_PANEL_ID } from "./side-panel";

export const FloatingButton = () => {
  const { isExpanded, togglePanel, position } = useSidebar();
  const label = () =>
    isExpanded()
      ? t("technical_list.floating_button.hide")
      : t("technical_list.floating_button.show");

  return (
    <Button
      // The button sits on the Odoo page, not on the panel: the light palette of the
      // theme keeps it deep and contrasted whatever the extension color scheme.
      data-theme={daisyThemeName(readDatasetSetting("extensionUiTheme"), "light")}
      data-color-scheme="light"
      size="sm"
      color={isExpanded() ? "accent" : "primary"}
      class={[
        "group h-11 min-w-11 gap-0 overflow-hidden border-0 px-3 text-xs font-medium shadow-card",
        "transition-[background-color,color,box-shadow,translate] duration-200 ease-theme hover:-translate-y-px hover:shadow-overlay",
        position === "left" ? "rounded-l-none rounded-r-full" : "rounded-l-full rounded-r-none",
      ].join(" ")}
      onClick={togglePanel}
      title={label()}
      aria-label={label()}
      aria-expanded={isExpanded()}
      aria-controls={TECHNICAL_PANEL_ID}
    >
      <HugeiconsIcon icon={SourceCodeIcon} size={18} strokeWidth={1.6} class="shrink-0" />
      <span
        class="max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-[max-width,opacity,margin] duration-200 ease-theme"
        classList={{
          "group-hover:ms-2 group-hover:max-w-40 group-hover:opacity-100 group-focus-visible:ms-2 group-focus-visible:max-w-40 group-focus-visible:opacity-100":
            !isExpanded(),
        }}
      >
        {t("technical_list.floating_button.title")}
      </span>
    </Button>
  );
};
