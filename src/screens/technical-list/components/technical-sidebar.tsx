import { createSignal } from "solid-js";

import { usePanelLayout } from "../panel-layout";
import { SidebarProvider, useSidebar } from "../sidebar-store";
import { FloatingButton } from "./floating-button";
import { SidePanel } from "./side-panel";

const TechnicalSidebarContent = () => {
  const sidebar = useSidebar();
  const [root, setRoot] = createSignal<HTMLDivElement>();
  usePanelLayout(root, sidebar.isExpanded, sidebar.position);

  return (
    <div
      ref={setRoot}
      class={`fixed ${sidebar.position === "left" ? "left-0 items-start" : "right-0 items-end"} bottom-6 z-9999 flex flex-col gap-2 text-sm/6 max-md:bottom-5`}
      data-technical-list-root="true"
    >
      <FloatingButton />
      <SidePanel />
    </div>
  );
};

export const TechnicalSidebar = () => (
  <SidebarProvider>
    <TechnicalSidebarContent />
  </SidebarProvider>
);
