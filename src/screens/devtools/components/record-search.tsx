import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  Cancel01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { makeEventListener } from "@solid-primitives/event-listener";
import { debounce } from "@solid-primitives/scheduled";
import { createEffect, createSignal, on, Show } from "solid-js";

import { IconButton } from "@/components/ui/button";
import { HugeiconsIcon, type IconData } from "@/components/ui/hugeicons-icon";
import { Input } from "@/components/ui/input";
import {
  clearHighlights,
  findMatches,
  highlightIn,
  showMatch,
  type SearchMatch,
} from "@/screens/devtools/components/record-search-dom";
import { t } from "@/services/i18n-service";

interface RecordSearchProps {
  /** Element holding the rendered records. */
  root: () => HTMLElement | undefined;
  /** Highlights are cleared whenever it changes (new results). */
  resetKey: unknown;
}

/** Ctrl+F search bar over the rendered records. */
export const RecordSearch = (props: RecordSearchProps) => {
  const [isVisible, setIsVisible] = createSignal(false);
  // Bumped by each Ctrl+F: the open bar takes the focus back.
  const [focusRequest, setFocusRequest] = createSignal(0);
  const [term, setTerm] = createSignal("");
  const [matches, setMatches] = createSignal<SearchMatch[]>([]);
  const [current, setCurrent] = createSignal(0);

  const runSearch = (value: string) => {
    const root = props.root();
    if (!root) return;
    clearHighlights(root);
    const found = findMatches(root, value);
    for (const match of found) highlightIn(match.element, value.trim());
    setTerm(value.trim());
    setMatches(found);
    setCurrent(0);
  };
  const debouncedSearch = debounce(runSearch, 500);

  const close = () => {
    setIsVisible(false);
    const root = props.root();
    if (root) clearHighlights(root);
    setTerm("");
    setMatches([]);
  };

  const step = (direction: 1 | -1) => {
    const count = matches().length;
    if (count > 0) setCurrent((current() + direction + count) % count);
  };

  createEffect(() => {
    const match = matches()[current()];
    const root = props.root();
    if (match && root) showMatch(root, match, term());
  });

  createEffect(on(() => props.resetKey, close, { defer: true }));

  makeEventListener(
    document,
    "keydown",
    (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        e.stopImmediatePropagation();
        setIsVisible(true);
        setFocusRequest((n) => n + 1);
        return;
      }
      if (!isVisible()) return;
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        close();
      } else if (matches().length === 0) {
        return;
      } else if (e.key === "ArrowDown" || (e.ctrlKey && e.key === "g") || e.key === "Enter") {
        if (e.key === "Enter" && !(e.target as HTMLElement).closest(".record-search-bar")) return;
        e.preventDefault();
        step(1);
      } else if (e.key === "ArrowUp" || (e.ctrlKey && e.shiftKey && e.key === "G")) {
        e.preventDefault();
        step(-1);
      }
    },
    { capture: true },
  );

  return (
    <Show when={isVisible()}>
      <SearchBar
        focusRequest={focusRequest()}
        onInput={debouncedSearch}
        position={
          matches().length > 0
            ? `${current() + 1} ${t("devtools.record_search.of")} ${matches().length}`
            : ""
        }
        onPrevious={() => step(-1)}
        onNext={() => step(1)}
        onClose={close}
      />
    </Show>
  );
};

const SearchBar = (props: {
  focusRequest: number;
  onInput: (value: string) => void;
  position: string;
  onPrevious: () => void;
  onNext: () => void;
  onClose: () => void;
}) => {
  let input: HTMLInputElement | undefined;
  createEffect(
    on(
      () => props.focusRequest,
      () => input?.focus(),
    ),
  );
  const setInput = (element: HTMLInputElement) => (input = element);

  const navButton = (label: string, icon: IconData, onClick: () => void) => (
    <IconButton
      size="xs"
      variant="ghost"
      label={label}
      onClick={onClick}
      disabled={!props.position}
      icon={<HugeiconsIcon icon={icon} size={14} strokeWidth={1.5} />}
    />
  );

  return (
    <div class="record-search-bar animate-record-search-in sticky top-0 z-20 border-b border-line-soft bg-surface">
      <div class="flex items-center gap-2 px-3 py-1">
        <span class="text-ink-3">
          <HugeiconsIcon icon={Search01Icon} size={16} strokeWidth={1.5} />
        </span>
        <Input
          ref={setInput}
          type="text"
          placeholder={t("devtools.record_search.placeholder")}
          class="min-w-0"
          size="sm"
          variant="ghost"
          fullWidth
          onInput={(e) => props.onInput(e.currentTarget.value)}
        />
        <div class="flex items-center gap-1">
          <Show when={props.position}>
            <span class="font-mono text-caption whitespace-nowrap text-ink-3">
              {props.position}
            </span>
          </Show>
          {navButton(t("devtools.record_search.prev_hint"), ArrowUp01Icon, props.onPrevious)}
          {navButton(t("devtools.record_search.next_hint"), ArrowDown01Icon, props.onNext)}
          <IconButton
            size="xs"
            variant="ghost"
            color="error"
            label={t("devtools.record_search.close_hint")}
            onClick={props.onClose}
            icon={<HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={1.5} />}
          />
        </div>
      </div>
    </div>
  );
};
