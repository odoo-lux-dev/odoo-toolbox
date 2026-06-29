import { type JSX } from "solid-js";

import { OptionsSidebar } from "./options-sidebar";

export const OptionsLayout = (props: { children: JSX.Element }) => {
  return (
    <div class="h-screen overflow-hidden bg-base-300 text-base-content">
      <div class="flex h-full">
        <OptionsSidebar />
        <main id="content-container" class="h-full flex-1 overflow-y-auto bg-base-300 px-6 py-8">
          {props.children}
        </main>
      </div>
    </div>
  );
};
