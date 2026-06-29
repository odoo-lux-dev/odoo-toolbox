import { createEffect, onCleanup } from "solid-js";

import {
  useDatabaseInfo,
  useTechnicalSidebar,
  useViewInfo,
} from "@/screens/technical-list/components/hooks";
import {
  closePanel,
  isExpandedSignal,
  isSelectionModeSignal,
  selectedElementSignal,
  setIsSelectionModeSignal,
  setSelectedElementSignal,
} from "@/screens/technical-list/technical-sidebar-signals";
import { getTechnicalListPosition } from "@/utils/utils";

import { FloatingButton } from "./floating-button";
import { SidePanel } from "./side-panel";

const TechnicalSidebarContent = () => {
  const { buttonRef } = useTechnicalSidebar();
  const position = getTechnicalListPosition();

  return (
    <div
      ref={buttonRef}
      class={`fixed ${position === "left" ? "left-0 items-start" : "right-0 items-end"} bottom-6 z-9999 flex flex-col gap-2 text-sm/6 max-md:bottom-5`}
      data-technical-list-root="true"
    >
      <FloatingButton />
      <SidePanel />
    </div>
  );
};

export const TechnicalSidebar = () => {
  const { refresh: refreshViewInfo } = useViewInfo();
  const { refresh: refreshDbInfo } = useDatabaseInfo();

  createEffect(() => {
    refreshViewInfo();
    refreshDbInfo();
  });

  createEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();

        if (isSelectionModeSignal()) {
          const selected = selectedElementSignal();
          if (selected) {
            selected.classList.remove("x-odoo-field-selector-highlight");
            setSelectedElementSignal(null);
          } else {
            setIsSelectionModeSignal(false);
          }
        } else if (isExpandedSignal()) {
          closePanel();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    onCleanup(() => {
      document.removeEventListener("keydown", handleKeyDown);
    });
  });

  return <TechnicalSidebarContent />;
};
