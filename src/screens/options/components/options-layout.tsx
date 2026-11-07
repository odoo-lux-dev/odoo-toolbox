import { Show, type JSX } from "solid-js";

import { CommandPalette, useCommandPalette } from "@/components/ui/command-palette";
import { ConfirmDialogHost } from "@/components/ui/confirm-dialog";
import { MAIN_CONTENT_ID, SkipLink } from "@/components/ui/skip-link";
import { optionsCommands } from "@/screens/options/commands";
import { drawerOpen, setDrawerOpen, SCROLL_CONTAINER_ID } from "@/screens/options/options-nav";

import { OptionsSidebar } from "./options-sidebar";
import { OptionsTopbar } from "./options-topbar";

export const OptionsLayout = (props: { children: JSX.Element }) => {
  const palette = useCommandPalette();

  return (
    <div class="flex h-screen overflow-hidden bg-canvas text-ink">
      <SkipLink />
      <OptionsSidebar />
      <Show when={drawerOpen()}>
        <button
          type="button"
          class="fixed inset-0 z-40 bg-scrim backdrop-blur-[1px] lg:hidden"
          aria-hidden="true"
          tabindex={-1}
          onClick={() => setDrawerOpen(false)}
        />
      </Show>
      <main class="flex h-screen min-w-0 flex-1 flex-col bg-canvas">
        <OptionsTopbar onOpenCommands={() => palette.setOpen(true)} />
        <div id={SCROLL_CONTAINER_ID} class="min-h-0 flex-1 overflow-y-auto">
          <div
            id={MAIN_CONTENT_ID}
            class="mx-auto w-full max-w-285 px-3.5 pt-5 pb-12 sm:px-6.5 sm:pt-7 sm:pb-14 xl:px-10.5 xl:pt-9.5 xl:pb-18"
          >
            {props.children}
          </div>
        </div>
      </main>
      <CommandPalette
        open={palette.open()}
        onClose={() => palette.setOpen(false)}
        commands={optionsCommands}
        scope="options"
      />
      <ConfirmDialogHost />
    </div>
  );
};
