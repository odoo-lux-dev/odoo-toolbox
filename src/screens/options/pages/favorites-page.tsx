import { DragDropVerticalIcon } from "@hugeicons/core-free-icons";
import { createSignal, Show, For, onCleanup, onMount } from "solid-js";

import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { FavoriteRow } from "@/screens/options/components/favorite-row";
import { FavoriteTaskLinkModal } from "@/screens/options/components/favorite-task-link-modal";
import { useOptions } from "@/screens/options/options-signals";
import { favoritesService } from "@/services/favorites-service";
import { t } from "@/services/i18n-service";
import { Favorite } from "@/types";
import { attachAutoScroll, createSortableList, reorderArray } from "@/utils/drag-drop";

export const FavoritesPage = () => {
  const { favorites, loading } = useOptions();
  const [showModal, setShowModal] = createSignal(false);
  const [selectedFavorite, setSelectedFavorite] = createSignal<Favorite | null>(null);
  const [editingRowName, setEditingRowName] = createSignal<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = createSignal(false);

  const handleEditTaskLink = (favorite: Favorite) => {
    setSelectedFavorite(favorite);
    setShowModal(true);
  };

  const handleSaveTaskLink = async (name: string, taskLink: string) => {
    await favoritesService.setProjectTaskUrl(name, taskLink);
    setShowModal(false);
  };

  const handleEditName = async (name: string, newDisplayName: string) => {
    const currentFavs = favorites();
    if (!currentFavs) return;

    const updatedFavorites = currentFavs.map((fav) =>
      fav.name === name ? { ...fav, display_name: newDisplayName } : fav,
    );

    await favoritesService.setFavoritesProjects(updatedFavorites);
  };

  const handleDelete = async (name: string) => {
    const currentFavs = favorites();
    if (!currentFavs) return;

    const updatedFavorites = currentFavs.filter((fav) => fav.name !== name);
    await favoritesService.setFavoritesProjects(updatedFavorites);
  };

  const handleEdition = (isEditing: boolean, favoriteName?: string) => {
    setEditingRowName(isEditing ? favoriteName || null : null);
  };

  const handleReorder = async (
    fromIndex: number,
    toIndex: number,
    position: "before" | "after",
  ) => {
    const currentFavs = favorites();
    if (!currentFavs) return;
    const reordered = reorderArray(currentFavs, fromIndex, toIndex, position);
    await favoritesService.reorderFavorites(reordered);
  };

  const sortable = createSortableList({
    type: "favorite",
    onReorder: handleReorder,
  });

  return (
    <Show
      when={!loading()}
      fallback={
        <div class="flex items-center gap-2 text-sm opacity-80">
          <span class="loading loading-sm loading-spinner" />
          <span>{t("common.loading_favorites")}</span>
        </div>
      }
    >
      <Show
        when={favorites()?.length}
        fallback={
          <div class="flex flex-col gap-4">
            <div class="divider">
              <h2 class="text-xl font-semibold">{t("common.favorite_projects")}</h2>
            </div>
            <div class="card bg-base-200 shadow-sm">
              <div class="card-body gap-3">
                <p class="text-sm opacity-80">{t("common.no_favorites")}</p>
                <p class="text-sm opacity-80">{t("common.no_favorites_hint")}</p>
                <a
                  class="btn w-fit btn-primary btn-sm"
                  target="_blank"
                  rel="noreferrer noopener"
                  href="https://www.odoo.sh/project"
                >
                  {t("common.take_me_to_sh")}
                </a>
              </div>
            </div>
          </div>
        }
      >
        <div class="flex flex-col gap-4">
          <div class="divider">
            <h2 class="text-xl font-semibold">{t("common.favorite_projects")}</h2>
          </div>
          <div
            class="flex flex-col gap-2 pt-1.5"
            ref={() => {
              onMount(() => {
                const scrollContainer = document.getElementById("content-container");
                if (scrollContainer) {
                  const cleanup = attachAutoScroll(scrollContainer);
                  onCleanup(cleanup);
                }
              });
            }}
          >
            <For each={favorites() ?? []}>
              {(favorite, index) => {
                let rowEl!: HTMLDivElement;
                let handleEl!: HTMLDivElement;
                const item = sortable.useItem(index);
                onMount(() => {
                  const cleanup = item.attach(rowEl, handleEl);
                  onCleanup(cleanup);
                });
                return (
                  <div
                    ref={rowEl}
                    class="relative"
                    classList={{
                      "opacity-40": item.isDragging(),
                    }}
                  >
                    <div class="flex items-center gap-1">
                      <div
                        ref={handleEl}
                        class="cursor-grab text-base-content/40 hover:text-base-content active:cursor-grabbing"
                      >
                        <HugeiconsIcon icon={DragDropVerticalIcon} size={16} color="currentColor" />
                      </div>
                      <div class="flex-1">
                        <FavoriteRow
                          favorite={favorite}
                          isOtherRowEditing={
                            editingRowName() !== null && editingRowName() !== favorite.name
                          }
                          onEditName={handleEditName}
                          onEditTaskLink={handleEditTaskLink}
                          onDelete={handleDelete}
                          onEdition={(isEditing) => handleEdition(isEditing, favorite.name)}
                          onDeleteModalChange={(isOpen) => {
                            setDeleteModalOpen(isOpen);
                          }}
                        />
                      </div>
                    </div>
                    <Show
                      when={
                        sortable.dropTarget()?.index === index() &&
                        sortable.dropTarget()?.edge === "top"
                      }
                    >
                      <div
                        class="absolute inset-x-0 z-10 h-0.5 rounded-full bg-primary"
                        style={{ top: "-5px" }}
                      />
                    </Show>
                    <Show
                      when={
                        sortable.dropTarget()?.index === index() &&
                        sortable.dropTarget()?.edge === "bottom"
                      }
                    >
                      <div
                        class="absolute inset-x-0 z-10 h-0.5 rounded-full bg-primary"
                        style={{
                          top: "calc(100% + 3px)",
                        }}
                      />
                    </Show>
                  </div>
                );
              }}
            </For>
          </div>

          <Show when={selectedFavorite()}>
            <FavoriteTaskLinkModal
              favorite={selectedFavorite()!}
              open={showModal()}
              onClose={() => setShowModal(false)}
              onConfirm={handleSaveTaskLink}
            />
          </Show>
        </div>
      </Show>
    </Show>
  );
};
