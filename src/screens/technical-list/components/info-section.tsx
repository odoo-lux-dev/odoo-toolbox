import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { createEffect, createMemo, JSX, Show, splitProps } from "solid-js";

import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import {
  expandedSectionsSignal,
  setSectionExpanded,
  useTechnicalListSections,
} from "@/screens/technical-list/technical-list-signals";
import { t } from "@/utils/i18n-page";

interface InfoSectionProps {
  icon: JSX.Element;
  title: string;
  children: JSX.Element;
  defaultExpanded?: boolean;
  sectionId?: string;
}

export const InfoSection = (props: InfoSectionProps) => {
  const [local] = splitProps(props, ["icon", "title", "children", "defaultExpanded", "sectionId"]);
  const { toggleSectionExpanded } = useTechnicalListSections();

  const effectiveSectionId = () =>
    local.sectionId || local.title.toLowerCase().replace(/\s+/g, "-");

  createEffect(() => {
    const id = effectiveSectionId();
    if (local.defaultExpanded && !expandedSectionsSignal().has(id)) {
      setSectionExpanded(id, true);
    }
  });

  const isExpanded = createMemo(() => expandedSectionsSignal().has(effectiveSectionId()));

  const toggleExpanded = () => {
    toggleSectionExpanded(effectiveSectionId());
  };

  return (
    <div class="border-b border-solid border-base-100 px-2 py-4 dark:border-base-200">
      <button
        type="button"
        onClick={toggleExpanded}
        aria-expanded={isExpanded()}
        class="flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-start text-base font-semibold text-base-content transition-colors hover:bg-base-200/60"
        title={
          isExpanded()
            ? t("technical_list.info_section.collapse")
            : t("technical_list.info_section.expand")
        }
      >
        <div class="flex items-center gap-2">
          <span class="text-base opacity-70">{local.icon}</span>
          <span>{local.title}</span>
        </div>
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          size={14}
          color="currentColor"
          strokeWidth={1.6}
          class={`transition-transform duration-200 ${isExpanded() ? "rotate-90" : ""}`}
        />
      </button>
      <Show when={isExpanded()}>
        <div class="mt-3">{local.children}</div>
      </Show>
    </div>
  );
};
