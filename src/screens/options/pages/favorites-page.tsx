import {
  ArrowUpRight01Icon,
  DragDropVerticalIcon,
  MoreHorizontalIcon,
} from "@hugeicons/core-free-icons";
import { createMemo, createSignal, Show, For, onCleanup, onMount } from "solid-js";

import { Badge } from "@/components/ui/badge";
import { matchesQuery } from "@/components/ui/command-registry";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { LiveRegion } from "@/components/ui/live-region";
import { useFavorites } from "@/hooks/use-favorites";
import { FavoriteRow } from "@/screens/options/components/favorite-row";
import { FavoriteTaskLinkModal } from "@/screens/options/components/favorite-task-link-modal";
import { NoSearchResults, PageHeader } from "@/screens/options/components/page-header";
import { SCROLL_CONTAINER_ID, searchQuery } from "@/screens/options/options-nav";
import { NoFavoritesState } from "@/screens/shared/no-favorites-state";
import { favoritesService } from "@/services/favorites-service";
import { t } from "@/services/i18n-service";
import type { Favorite } from "@/types";
import { ODOO_SH_PROJECTS_URL } from "@/utils/constants";
import { attachAutoScroll, createSortableList, reorderArray } from "@/utils/drag-drop";

export const FavoritesPage = () => {
  const { favorites, loading } = useFavorites();
  const [taskLinkFavorite, setTaskLinkFavorite] = createSignal<Favorite | null>(null);
  const [editingRowName, setEditingRowName] = createSignal<string | null>(null);

  const count = () => favorites().length;
  const matches = (favorite: Favorite) =>
    matchesQuery(`${favorite.display_name} ${favorite.name}`, searchQuery());
  const visibleCount = createMemo(() => favorites().filter(matches).length);

  const handleSaveTaskLink = (name: string, taskLink: string) =>
    favoritesService.setProjectTaskUrl(name, taskLink);

  const handleReorder = (fromIndex: number, toIndex: number, position: "before" | "after") =>
    favoritesService.reorderFavorites(reorderArray(favorites(), fromIndex, toIndex, position));

  /** Reorder handle of each row, by project name (rows are recreated on reorder). */
  const handles = new Map<string, HTMLButtonElement>();

  const handleMove = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= count()) return;
    const moved = favorites()[index].name;
    await handleReorder(index, target, direction < 0 ? "before" : "after");
    // Keep the keyboard focus on the moved row handle.
    requestAnimationFrame(() => handles.get(moved)?.focus());
  };

  const sortable = createSortableList({
    type: "favorite",
    onReorder: handleReorder,
  });

  /** Screen reader announcement of the favorites search. */
  const searchAnnouncement = () => {
    if (!searchQuery().trim()) return "";
    const visible = visibleCount();
    return visible === 0 ? t("options.search.no_favorites_title") : countLabel(visible);
  };

  const countLabel = (value: number) =>
    value === 1
      ? t("options.page.favorites_count_one")
      : t("options.page.favorites_count_other", [value]);

  onMount(() => {
    const scrollContainer = document.getElementById(SCROLL_CONTAINER_ID);
    if (scrollContainer) onCleanup(attachAutoScroll(scrollContainer));
  });

  return (
    <div>
      <LiveRegion message={searchAnnouncement()} />
      <PageHeader
        eyebrow={t("options.page.favorites_eyebrow")}
        title={t("options.page.favorites_title")}
        description={t("options.page.favorites_desc")}
        meta={
          <>
            <Show when={count() > 0}>
              <Badge variant="soft" color="primary" size="sm">
                {countLabel(count())}
              </Badge>
            </Show>
            <a
              class="btn border-line bg-surface btn-sm"
              href={ODOO_SH_PROJECTS_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("options.page.open_odoo_sh")}
              <span class="rtl:-scale-x-100">
                <HugeiconsIcon icon={ArrowUpRight01Icon} size={13} strokeWidth={1.8} />
              </span>
            </a>
          </>
        }
      />
      <Show
        when={!loading()}
        fallback={
          <div class="flex items-center gap-2 text-sm text-ink-2">
            <span class="loading loading-sm loading-spinner" />
            <span>{t("common.loading_favorites")}</span>
          </div>
        }
      >
        <Show when={count() > 0} fallback={<NoFavoritesState framed />}>
          <div class="mb-2.75 flex flex-col gap-1.5 rounded-field border border-line bg-surface px-2.75 py-2.25 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <div class="flex items-center gap-1.75 text-note text-ink-3">
              <span class="text-ink-4">
                <HugeiconsIcon icon={DragDropVerticalIcon} size={14} strokeWidth={2} />
              </span>
              <span>{t("options.favorites_list.toolbar_hint")}</span>
            </div>
            <Badge
              variant="soft"
              color="accent"
              size="xs"
              class="gap-1 before:size-1.25 before:rounded-full before:bg-current"
            >
              {t("options.favorites_list.auto_saved")}
            </Badge>
          </div>

          <div class="flex flex-col gap-1.5" aria-label={t("common.favorite_projects")}>
            <For each={favorites()}>
              {(favorite, index) => {
                let rowEl: HTMLDivElement | undefined;
                let handleEl!: HTMLButtonElement;
                const item = sortable.useItem(index);
                onMount(() => {
                  if (!rowEl) return;
                  const cleanup = item.attach(rowEl, handleEl);
                  onCleanup(() => {
                    cleanup();
                    if (handles.get(favorite.name) === handleEl) handles.delete(favorite.name);
                  });
                });
                return (
                  <div
                    ref={(el) => (rowEl = el)}
                    class="relative"
                    classList={{ "opacity-40": item.isDragging() }}
                    hidden={!matches(favorite)}
                  >
                    <FavoriteRow
                      favorite={favorite}
                      handleRef={(el) => {
                        handleEl = el;
                        handles.set(favorite.name, el);
                      }}
                      onMove={(direction) => handleMove(index(), direction)}
                      isOtherRowEditing={
                        editingRowName() !== null && editingRowName() !== favorite.name
                      }
                      onEditTaskLink={setTaskLinkFavorite}
                      onEdition={(isEditing) => setEditingRowName(isEditing ? favorite.name : null)}
                    />
                    <Show when={sortable.dropTarget()?.index === index()}>
                      <div
                        class="absolute inset-x-0 z-10 h-0.5 rounded-full bg-accent"
                        style={{
                          top: sortable.dropTarget()?.edge === "top" ? "-4px" : "calc(100% + 2px)",
                        }}
                      />
                    </Show>
                  </div>
                );
              }}
            </For>
          </div>

          <Show when={visibleCount() === 0}>
            <NoSearchResults
              title={t("options.search.no_favorites_title")}
              description={t("options.search.no_favorites_desc", [searchQuery().trim()])}
            />
          </Show>

          <p class="mt-4 flex items-center gap-1.5 text-small text-ink-3">
            <HugeiconsIcon icon={MoreHorizontalIcon} size={13} strokeWidth={1.8} />
            <span>{t("options.favorites_list.footnote")}</span>
          </p>

          <Show when={taskLinkFavorite()}>
            {(favorite) => (
              <FavoriteTaskLinkModal
                favorite={favorite()}
                onClose={() => setTaskLinkFavorite(null)}
                onConfirm={handleSaveTaskLink}
              />
            )}
          </Show>
        </Show>
      </Show>
    </div>
  );
};
