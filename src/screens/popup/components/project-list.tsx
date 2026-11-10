import { Search01Icon } from "@hugeicons/core-free-icons";
import { createMemo, createSignal, For, Index, Match, Show, Switch } from "solid-js";

import { CountPill } from "@/components/ui/chip";
import { matchesQuery } from "@/components/ui/command-registry";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { LiveRegion } from "@/components/ui/live-region";
import { StateMessage } from "@/components/ui/status";
import { useFavorites } from "@/hooks/use-favorites";
import { useSlashFocus } from "@/hooks/use-slash-focus";
import { openFavoriteInNewTab, openFavoriteInTab } from "@/screens/popup/actions";
import { NoFavoritesState } from "@/screens/shared/no-favorites-state";
import { t } from "@/services/i18n-service";

import { ProjectItem } from "./project-item";

const LIST_CARD = "ot-card overflow-hidden shadow-raised";

const NoResults = () => (
  <div class={LIST_CARD}>
    <StateMessage
      tone="primary"
      headingLevel={2}
      icon={<HugeiconsIcon icon={Search01Icon} size={22} strokeWidth={1.8} />}
      title={t("popup.no_match")}
      description={t("popup.no_match_hint")}
    />
  </div>
);

const LoadingSkeleton = () => (
  <div class={LIST_CARD} aria-hidden="true">
    <Index each={["w-[62%]", "w-[48%]", "w-[62%]", "w-[48%]"]}>
      {(width) => (
        <div class="ot-row border-line-soft not-first:border-t">
          <span class="ot-skeleton size-target flex-none" data-pulse="" />
          <span class="flex flex-1 flex-col gap-1.25">
            <span class={`ot-skeleton h-2 ${width()}`} data-pulse="" />
            <span class="ot-skeleton h-1.5 w-[34%]" data-pulse="" />
          </span>
        </div>
      )}
    </Index>
  </div>
);

export const ProjectList = () => {
  const { favorites, loading } = useFavorites();
  const [query, setQuery] = createSignal("");
  let searchInput: HTMLInputElement | undefined;

  const filtered = createMemo(() =>
    favorites().filter((favorite) =>
      matchesQuery(`${favorite.display_name} ${favorite.name}`, query()),
    ),
  );

  /** Screen reader announcement of the list state (the visual states are not live). */
  const announcement = () => {
    if (loading()) return t("common.loading_favorites");
    if (favorites().length === 0) return t("common.no_favorites");
    if (!query().trim()) return "";
    const count = filtered().length;
    if (count === 0) return t("popup.no_match");
    return count === 1 ? t("popup.results_count_one") : t("popup.results_count_other", [count]);
  };

  useSlashFocus(() => searchInput);

  const handleSearchKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setQuery("");
      searchInput?.blur();
    } else if (event.key === "Enter" && query().trim() && filtered().length === 1) {
      event.preventDefault();
      const { name } = filtered()[0];
      if (event.ctrlKey || event.metaKey) openFavoriteInNewTab(name);
      else openFavoriteInTab(name);
    }
  };

  return (
    <div class="flex min-h-0 flex-1 flex-col px-3.25 pt-3.25">
      <div class="flex items-center justify-between gap-2">
        <h1 class="flex items-center gap-1.75 font-display text-xl font-semibold tracking-[-0.035em] text-ink">
          {t("popup.title")}
          <CountPill>{loading() ? "–" : favorites().length}</CountPill>
        </h1>
      </div>

      <Show when={loading() || favorites().length > 0}>
        {/* Label read by screen readers; a theme may show it (`.ot-field-label`) */}
        <label for="project-search" class="ot-field-label mt-2.5" data-slot="popup-search-label">
          {t("popup.search_label")}
        </label>
        <Input
          ref={(el) => {
            searchInput = el;
            // Browsers ignore `autofocus` in extension popups: focus once the popup is painted.
            requestAnimationFrame(() => el.focus());
          }}
          id="project-search"
          type="search"
          fullWidth
          affixStyle="plain"
          // The popup is a height-capped column: only the list may shrink (DaisyUI
          // `.input` is `flex-shrink: 1` and would collapse with many favorites).
          class="mt-2.5 h-search shrink-0 gap-1.75 rounded-field px-2.25 text-body focus-within:*:last:hidden [&_input::-webkit-search-cancel-button]:cursor-pointer"
          placeholder={t("popup.search_placeholder")}
          autocomplete="off"
          spellcheck={false}
          value={query()}
          onInput={(event) => setQuery(event.currentTarget.value)}
          onKeyDown={handleSearchKeyDown}
          prefix={<HugeiconsIcon icon={Search01Icon} size={15} strokeWidth={2} />}
          suffix={<Kbd>/</Kbd>}
        />
      </Show>

      <LiveRegion message={announcement()} />
      <div class="mt-2.5 min-h-0 flex-1 overflow-y-auto pe-1 pb-3">
        <Switch>
          <Match when={loading()}>
            <LoadingSkeleton />
          </Match>
          <Match when={favorites().length === 0}>
            <div class={LIST_CARD}>
              <NoFavoritesState />
            </div>
          </Match>
          <Match when={filtered().length === 0}>
            <NoResults />
          </Match>
          <Match when={true}>
            <ul id="projects" class={LIST_CARD} aria-label={t("popup.title")}>
              <For each={filtered()}>{(favorite) => <ProjectItem favorite={favorite} />}</For>
            </ul>
          </Match>
        </Switch>
      </div>
    </div>
  );
};
