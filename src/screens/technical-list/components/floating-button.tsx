import { SourceCodeIcon } from "@hugeicons/core-free-icons";

import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { useTechnicalSidebar } from "@/screens/technical-list/components/hooks";
import { t } from "@/utils/i18n-page";
import { getTechnicalListPosition } from "@/utils/utils";

export const FloatingButton = () => {
  const { isExpanded, handleToggle } = useTechnicalSidebar();
  const position = getTechnicalListPosition();

  return (
    <Button
      size="sm"
      class={[
        "h-11",
        "group",
        "transition-all",
        "duration-300",
        position === "left" ? "rounded-r-full rounded-l-none" : "rounded-l-full rounded-r-none",
        "px-3",
        "gap-2",
        "overflow-hidden",
        "min-w-9 max-w-9 hover:max-w-60",
        position === "left" ? "justify-end" : "justify-start",
        isExpanded()
          ? "bg-accent hover:bg-accent text-accent-content"
          : "bg-primary hover:bg-primary text-white",
        "border-0",
      ].join(" ")}
      onClick={handleToggle}
      title={
        isExpanded()
          ? t("technical_list.floating_button.hide")
          : t("technical_list.floating_button.show")
      }
      type="button"
      aria-expanded={isExpanded()}
    >
      {position === "left" ? (
        <>
          <span class="button-text text-xs font-medium whitespace-nowrap opacity-0 transition-opacity group-hover:opacity-100">
            {t("technical_list.floating_button.title")}
          </span>
          <HugeiconsIcon
            icon={SourceCodeIcon}
            size={18}
            color="currentColor"
            strokeWidth={1.6}
            class="shrink-0"
          />
        </>
      ) : (
        <>
          <HugeiconsIcon
            icon={SourceCodeIcon}
            size={18}
            color="currentColor"
            strokeWidth={1.6}
            class="shrink-0"
          />
          <span class="button-text text-xs font-medium whitespace-nowrap opacity-0 transition-opacity group-hover:opacity-100">
            {t("technical_list.floating_button.title")}
          </span>
        </>
      )}
    </Button>
  );
};
