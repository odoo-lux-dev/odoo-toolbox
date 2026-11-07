import { ArrowUpRight01Icon, CommandIcon, Search01Icon } from "@hugeicons/core-free-icons";
import { makeEventListener } from "@solid-primitives/event-listener";
import {
  createEffect,
  createMemo,
  createSignal,
  For,
  Index,
  on,
  onCleanup,
  Show,
  type Accessor,
} from "solid-js";

import { filterCommands, type Command } from "@/components/ui/command-registry";
import { cx } from "@/components/ui/cx";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Kbd } from "@/components/ui/kbd";
import { ToolButton } from "@/components/ui/tool-button";
// Shared with the DevTools panel: page-world translations (see modal.tsx).
import { t } from "@/utils/i18n-page";

/**
 * Local command palette (mockups/09-command): one shared component, one registry
 * per surface (popup, options, DevTools). A surface only lists the commands it can
 * run itself; the empty state explains where other actions live.
 *
 * Styled with theme contract utilities only, so it follows the active UI theme.
 */

interface CommandPaletteLabels {
  /** Scope chip, e.g. "Popup". */
  scope: string;
  placeholder: string;
  move: string;
  run: string;
  close: string;
  /** e.g. (count) => `${count} commands` */
  count: (count: number) => string;
  noMatch: (query: string) => string;
  /** Where the actions this surface can't run actually live. */
  boundary: string;
}

type CommandScope = "popup" | "options" | "devtools";

const paletteLabels = (scope: CommandScope): CommandPaletteLabels => ({
  scope: t(`commands.scope_${scope}`),
  placeholder: t("commands.placeholder"),
  move: t("commands.move"),
  run: t("commands.run"),
  close: t("commands.close"),
  count: (count) => t("commands.count", [count]),
  noMatch: (query) => (query ? t("commands.no_match", [query]) : t("commands.empty")),
  boundary: t(`commands.boundary_${scope}`),
});

const isMac = () =>
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/i.test(navigator.platform ?? "");

/** Platform modifier keycap: ⌘ on macOS, Ctrl elsewhere. */
const modifierKey = () => (isMac() ? "⌘" : "Ctrl");

/**
 * Open state of a surface palette, bound to Cmd/Ctrl+K (works from inputs too,
 * the shortcut is not used by the extension pages otherwise).
 */
export const useCommandPalette = (): {
  open: Accessor<boolean>;
  setOpen: (open: boolean) => void;
} => {
  const [open, setOpen] = createSignal(false);
  makeEventListener(document, "keydown", (event) => {
    if (event.key.toLowerCase() !== "k" || event.altKey || event.shiftKey) return;
    if (!(isMac() ? event.metaKey : event.ctrlKey)) return;
    event.preventDefault();
    setOpen(!open());
  });
  return { open, setOpen };
};

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  /** Built when the palette opens, so it reflects the current state. */
  commands: () => Command[];
  /** Surface of the palette: scope chip and boundary message. */
  scope: CommandScope;
}

export const CommandPalette = (props: CommandPaletteProps) => (
  <Show when={props.open}>
    <CommandPaletteDialog {...props} />
  </Show>
);

const CommandPaletteDialog = (props: CommandPaletteProps) => {
  const labels = paletteLabels(props.scope);
  const [query, setQuery] = createSignal("");
  const [activeIndex, setActiveIndex] = createSignal(0);
  const commands = props.commands();
  const results = createMemo(() => filterCommands(commands, query()));
  const groups = createMemo(() => {
    const byGroup = new Map<string, Command[]>();
    for (const command of results()) {
      byGroup.set(command.group, [...(byGroup.get(command.group) ?? []), command]);
    }
    return [...byGroup.entries()].map(([label, items]) => ({ label, items }));
  });
  /** Results in display order (groups flattened), used by the keyboard. */
  const ordered = createMemo(() => groups().flatMap((group) => group.items));

  const [navigated, setNavigated] = createSignal(false);
  let undoPreview: (() => void) | undefined;
  const endPreview = () => {
    undoPreview?.();
    undoPreview = undefined;
  };
  createEffect(
    on(
      () => (navigated() ? ordered()[activeIndex()] : undefined),
      (command) => {
        endPreview();
        undoPreview = command?.preview?.();
      },
    ),
  );
  onCleanup(endPreview);

  let inputRef: HTMLInputElement | undefined;
  let listRef: HTMLDivElement | undefined;
  const previousFocus = document.activeElement as HTMLElement | null;

  createEffect(() => {
    const index = activeIndex();
    listRef
      ?.querySelector<HTMLElement>(`[data-command-index="${index}"]`)
      ?.scrollIntoView({ block: "nearest" });
  });

  queueMicrotask(() => inputRef?.focus());
  onCleanup(() => previousFocus?.focus?.());

  const runCommand = async (command: Command | undefined) => {
    if (!command) return;
    props.onClose();
    await command.run();
  };

  const moveTo = (index: number) => {
    setNavigated(true);
    setActiveIndex(index);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    const count = ordered().length;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (count) moveTo((activeIndex() + 1) % count);
        break;
      case "ArrowUp":
        event.preventDefault();
        if (count) moveTo((activeIndex() - 1 + count) % count);
        break;
      case "Home":
        event.preventDefault();
        moveTo(0);
        break;
      case "End":
        event.preventDefault();
        moveTo(Math.max(0, count - 1));
        break;
      case "Enter":
        event.preventDefault();
        void runCommand(ordered()[activeIndex()]);
        break;
      case "Escape":
        event.preventDefault();
        event.stopPropagation();
        props.onClose();
        break;
      case "Tab":
        // Focus stays in the palette: the list is driven by the arrows.
        event.preventDefault();
        break;
    }
  };

  const listboxId = "command-palette-list";
  const optionId = (index: number) => `command-palette-option-${index}`;

  return (
    <div
      class="fixed inset-0 z-50 flex items-start justify-center bg-scrim px-3 pt-[8vh]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) props.onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={labels.scope}
        class="flex max-h-[min(30rem,84vh)] w-full max-w-140 flex-col overflow-hidden rounded-panel border border-line bg-surface text-ink shadow-pop"
        onKeyDown={handleKeyDown}
      >
        <header class="flex items-center gap-2 border-b border-line-soft px-3 py-2">
          <span class="inline-flex items-center gap-1 rounded-tight bg-primary-soft px-1.5 py-0.5 font-mono text-caption font-medium text-primary uppercase">
            <HugeiconsIcon icon={CommandIcon} size={11} strokeWidth={1.8} />
            {labels.scope}
          </span>
          <Kbd size="xs" class="ms-auto">
            Esc
          </Kbd>
        </header>

        <label class="flex items-center gap-2 border-b border-line px-3">
          <HugeiconsIcon
            icon={Search01Icon}
            size={16}
            strokeWidth={1.8}
            class="shrink-0 text-ink-3"
          />
          <input
            ref={(el) => (inputRef = el)}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={listboxId}
            aria-activedescendant={ordered().length ? optionId(activeIndex()) : undefined}
            aria-label={labels.placeholder}
            placeholder={labels.placeholder}
            autocomplete="off"
            spellcheck={false}
            class="min-h-11 min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-3"
            value={query()}
            onInput={(event) => {
              setQuery(event.currentTarget.value);
              setActiveIndex(0);
            }}
          />
        </label>

        <div
          ref={(el) => (listRef = el)}
          id={listboxId}
          role="listbox"
          class="min-h-0 flex-1 overflow-y-auto p-1.5"
        >
          <Show
            when={ordered().length > 0}
            fallback={
              <div class="flex flex-col items-center gap-1.5 px-6 py-8 text-center">
                <p class="text-label font-semibold text-ink">{labels.noMatch(query())}</p>
                <p class="max-w-90 text-note text-pretty text-ink-3">{labels.boundary}</p>
              </div>
            }
          >
            <For each={groups()}>
              {(group) => (
                <div role="group" aria-label={group.label} class="pb-1">
                  <div class="flex items-center justify-between px-2 pt-2 pb-1 font-mono text-caption tracking-wider text-ink-4 uppercase rtl:font-sans rtl:tracking-normal">
                    <span>{group.label}</span>
                    <span>{group.items.length}</span>
                  </div>
                  <Index each={group.items}>
                    {(command) => {
                      const index = () => ordered().indexOf(command());
                      const active = () => index() === activeIndex();
                      return (
                        <div
                          id={optionId(index())}
                          role="option"
                          aria-selected={active()}
                          data-command-index={index()}
                          class={cx(
                            "flex min-h-control cursor-pointer items-center gap-2.5 rounded-field border-s-2 px-2 text-label transition-colors duration-100 ease-theme",
                            active()
                              ? "border-primary bg-primary-soft text-ink"
                              : "border-transparent text-ink-2 hover:bg-surface-2",
                          )}
                          onMouseMove={() => {
                            if (index() !== activeIndex() || !navigated()) moveTo(index());
                          }}
                          onClick={() => void runCommand(command())}
                        >
                          <Show when={command().icon}>
                            {(icon) => (
                              <HugeiconsIcon
                                icon={icon()}
                                size={15}
                                strokeWidth={1.7}
                                class={cx("shrink-0", active() ? "text-primary" : "text-ink-4")}
                              />
                            )}
                          </Show>
                          <span class="min-w-0 flex-1 truncate">{command().label}</span>
                          <Show when={command().hint}>
                            <span class="max-w-40 shrink-0 truncate font-mono text-caption text-ink-4">
                              {command().hint}
                            </span>
                          </Show>
                          <Show when={command().external}>
                            <HugeiconsIcon
                              icon={ArrowUpRight01Icon}
                              size={12}
                              strokeWidth={1.8}
                              class="shrink-0 text-ink-4 rtl:-scale-x-100"
                            />
                          </Show>
                          <Show when={active()}>
                            <Kbd size="xs">↵</Kbd>
                          </Show>
                        </div>
                      );
                    }}
                  </Index>
                </div>
              )}
            </For>
          </Show>
        </div>

        <footer class="flex items-center gap-3 border-t border-line-soft bg-surface-2 px-3 py-1.5 text-caption text-ink-3">
          <span class="inline-flex items-center gap-1">
            <Kbd size="xs">↑</Kbd>
            <Kbd size="xs">↓</Kbd>
            {labels.move}
          </span>
          <span class="inline-flex items-center gap-1">
            <Kbd size="xs">↵</Kbd>
            {labels.run}
          </span>
          <span class="inline-flex items-center gap-1">
            <Kbd size="xs">Esc</Kbd>
            {labels.close}
          </span>
          <span class="ms-auto font-mono">{labels.count(ordered().length)}</span>
        </footer>
      </div>
    </div>
  );
};

/**
 * Visible entry point of the palette (the keyboard is never the only way). The
 * shortcut is given by the tooltip and `aria-keyshortcuts`, not drawn as keycaps.
 */
export const CommandTrigger = (props: { label: string; onClick: () => void; class?: string }) => (
  <ToolButton
    class={props.class}
    label={props.label}
    title={`${props.label} (${modifierKey()}+K)`}
    aria-keyshortcuts={isMac() ? "Meta+K" : "Control+K"}
    onClick={() => props.onClick()}
    icon={<HugeiconsIcon icon={CommandIcon} size={15} strokeWidth={1.8} />}
  />
);
