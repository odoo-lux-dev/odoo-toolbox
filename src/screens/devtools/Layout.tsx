import { SidebarLeftIcon } from "@hugeicons/core-free-icons";
import { For, Show, type JSX } from "solid-js";

import { CommandPalette, CommandTrigger, useCommandPalette } from "@/components/ui/command-palette";
import { CopyableText } from "@/components/ui/copyable-text";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { MAIN_CONTENT_ID, SkipLink } from "@/components/ui/skip-link";
import { StatusDot } from "@/components/ui/status";
import { Tab, Tabs } from "@/components/ui/tabs";
import { ToolButton } from "@/components/ui/tool-button";
import { devtoolsCommands } from "@/screens/devtools/commands";
import { databaseSignal, odooVersionSignal } from "@/screens/devtools/environment";
import { currentTab, navigate, railCollapsed, TABS, toggleRail } from "@/screens/devtools/router";
import { t } from "@/services/i18n-service";

const extensionVersion = () => {
  try {
    return browser.runtime.getManifest().version;
  } catch {
    return "";
  }
};

const StatusFooter = () => (
  <footer class="flex min-h-6.5 shrink-0 items-center gap-2 border-t border-line bg-surface px-3 font-mono text-caption text-ink-3">
    <StatusDot tone="success" pulse size="caption" class="shrink-0 text-ink-2">
      <Show when={odooVersionSignal()}>Odoo {odooVersionSignal()} </Show>
      {t("devtools.layout.connected")}
    </StatusDot>
    <Show when={databaseSignal()}>
      <span class="flex min-w-0 items-center gap-0.5">
        <span aria-hidden="true">·</span> {t("devtools.layout.database")}
        <CopyableText
          variant="subtle"
          value={databaseSignal()!}
          title={t("devtools.layout.copy_database")}
        />
      </span>
    </Show>
    <span class="ms-auto shrink-0 truncate">Odoo Toolbox · v{extensionVersion()}</span>
  </footer>
);

/** Tab rail ↔ content relationship (WAI-ARIA tabs pattern). */
const TAB_PANEL_ID = "devtools-tabpanel";
const tabId = (id: string) => `devtools-tab-${id}`;

export const DevToolsLayout = (props: { children: JSX.Element }) => {
  const palette = useCommandPalette();

  return (
    <div class="flex h-screen min-h-0 flex-col overflow-hidden bg-canvas text-ink">
      <SkipLink />
      <nav
        data-slot="devtools-tab-rail"
        class="flex h-tab shrink-0 items-stretch border-b border-line bg-surface px-2.5"
      >
        <ToolButton
          label={t("devtools.layout.toggle_rail")}
          aria-expanded={!railCollapsed()}
          size="sm"
          tone="primary"
          data-active={railCollapsed() ? "true" : undefined}
          class="self-center"
          onClick={toggleRail}
          icon={<HugeiconsIcon icon={SidebarLeftIcon} size={16} strokeWidth={1.6} />}
        />
        <span class="mx-1.5 h-4.5 w-px shrink-0 self-center bg-line" aria-hidden="true" />

        <Tabs class="min-w-0 flex-1 scrollbar-none overflow-x-auto">
          <For each={TABS}>
            {(item) => {
              const active = () => currentTab().id === item.id;
              return (
                <Tab
                  id={tabId(item.id)}
                  aria-controls={TAB_PANEL_ID}
                  active={active()}
                  onClick={() => navigate(item.id)}
                >
                  <HugeiconsIcon icon={item.icon} size={15} strokeWidth={1.6} />
                  {t(item.labelKey)}
                </Tab>
              );
            }}
          </For>
        </Tabs>

        <CommandTrigger
          label={t("commands.trigger")}
          onClick={() => palette.setOpen(true)}
          class="ms-2 self-center"
        />
      </nav>

      <main id={MAIN_CONTENT_ID} class="flex min-h-0 flex-1 flex-col bg-canvas">
        <div
          id={TAB_PANEL_ID}
          role="tabpanel"
          aria-labelledby={tabId(currentTab().id)}
          class="flex min-h-0 flex-1 flex-col"
        >
          {props.children}
        </div>
      </main>

      <StatusFooter />

      <CommandPalette
        open={palette.open()}
        onClose={() => palette.setOpen(false)}
        commands={devtoolsCommands}
        scope="devtools"
      />
    </div>
  );
};
