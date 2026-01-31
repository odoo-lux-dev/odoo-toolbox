import { useComputed, useSignal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";
import { createSwapy, Swapy, utils } from "swapy";
import { FavoriteRow } from "@/components/options/favorite-row";
import { FavoriteTaskLinkModal } from "@/components/options/favorite-task-link-modal";
import { useOptions } from "@/contexts/options-signals-hook";
import { favoritesService } from "@/services/favorites-service";
import { Favorite } from "@/types";

export const FavoritesPage = () => {
    const { favorites, loading } = useOptions();
    const showModal = useSignal(false);
    const selectedFavorite = useSignal<Favorite | null>(null);
    const editingRowName = useSignal<string | null>(null);
    const deleteModalOpen = useSignal(false);
    const favoritesContainerRef = useRef<HTMLDivElement>(null);
    const swapy = useRef<Swapy>(null);
    const slotItemMap = useSignal(
        utils.initSlotItemMap(favorites || [], "name"),
    );
    const slottedItems = useComputed(() =>
        utils.toSlottedItems(favorites || [], "name", slotItemMap.value),
    );

    const updateDragState = () => {
        const hasOpenModal = showModal.value || deleteModalOpen.value;
        const isEditing = editingRowName.value !== null;
        swapy.current?.enable(!hasOpenModal && !isEditing);
    };

    useEffect(
        () =>
            utils.dynamicSwapy(
                swapy.current,
                favorites || [],
                "name",
                slotItemMap.value,
                (newSlotItemMap) => {
                    slotItemMap.value = newSlotItemMap;
                },
            ),
        [favorites],
    );

    useEffect(() => {
        if (favoritesContainerRef.current && !loading) {
            swapy.current = createSwapy(favoritesContainerRef.current, {
                manualSwap: true,
                dragAxis: "y",
                animation: "spring",
                autoScrollOnDrag: true,
            });

            swapy.current.onSwap((event) => {
                slotItemMap.value = event.newSlotItemMap.asArray;
            });

            swapy.current.onSwapEnd(async (event) => {
                if (event.hasChanged) {
                    const newOrder = event.slotItemMap.asArray;
                    const reorderedFavorites = newOrder
                        .map((orderItem, index) => {
                            const favorite = favorites?.find(
                                (fav) => fav.name === orderItem.item,
                            );
                            if (favorite) {
                                return { ...favorite, sequence: index };
                            }
                            return favorite;
                        })
                        .filter(
                            (fav: Favorite | undefined) => fav !== undefined,
                        ) as Favorite[];
                    await favoritesService.setFavoritesProjects(
                        reorderedFavorites,
                    );
                }
            });

            updateDragState();
        }

        return () => {
            swapy.current?.destroy();
        };
    }, [loading, favorites]);

    useEffect(() => {
        updateDragState();
    }, [showModal.value, deleteModalOpen.value, editingRowName.value]);

    const handleEditTaskLink = (favorite: Favorite) => {
        selectedFavorite.value = favorite;
        showModal.value = true;
    };

    const handleSaveTaskLink = async (name: string, taskLink: string) => {
        await favoritesService.setProjectTaskUrl(name, taskLink);
        showModal.value = false;
    };

    const handleEditName = async (name: string, newDisplayName: string) => {
        if (!favorites) return;

        const updatedFavorites = favorites.map((fav) =>
            fav.name === name ? { ...fav, display_name: newDisplayName } : fav,
        );

        await favoritesService.setFavoritesProjects(updatedFavorites);
    };

    const handleDelete = async (name: string) => {
        if (!favorites) return;

        const updatedFavorites = favorites.filter((fav) => fav.name !== name);
        await favoritesService.setFavoritesProjects(updatedFavorites);
    };

    const handleEdition = (isEditing: boolean, favoriteName?: string) => {
        editingRowName.value = isEditing ? favoriteName || null : null;
        updateDragState();
    };

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-sm opacity-80">
                <span className="loading loading-spinner loading-sm" />
                <span>Loading favorites...</span>
            </div>
        );
    }

    if (!favorites?.length) {
        return (
            <div className="flex flex-col gap-4">
                <div className="divider">
                    <h2 className="text-xl font-semibold">Favorite projects</h2>
                </div>
                <div className="card bg-base-200 shadow-sm">
                    <div className="card-body gap-3">
                        <p className="text-sm opacity-80">
                            You have no favorite projects
                        </p>
                        <p className="text-sm opacity-80">
                            Click on the star icon next to the project name to
                            add it to your favorites
                        </p>
                        <a
                            className="btn btn-sm btn-primary w-fit"
                            target="_blank"
                            rel="noreferrer noopener"
                            href="https://www.odoo.sh/project"
                        >
                            Take me to Odoo.sh projects page
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="divider">
                <h2 className="text-xl font-semibold">Favorite projects</h2>
            </div>
            <div className="flex flex-col gap-2" ref={favoritesContainerRef}>
                {slottedItems.value.map(
                    ({ slotId, itemId, item: favorite }, index) =>
                        favorite ? (
                            <FavoriteRow
                                key={index}
                                slotId={slotId}
                                itemId={itemId}
                                favorite={favorite}
                                isOtherRowEditing={
                                    editingRowName.value !== null &&
                                    editingRowName.value !== favorite.name
                                }
                                onEditName={handleEditName}
                                onEditTaskLink={handleEditTaskLink}
                                onDelete={handleDelete}
                                onEdition={(isEditing) =>
                                    handleEdition(isEditing, favorite.name)
                                }
                                onDeleteModalChange={(isOpen) => {
                                    deleteModalOpen.value = isOpen;
                                    updateDragState();
                                }}
                            />
                        ) : null,
                )}
            </div>

            {selectedFavorite.value ? (
                <FavoriteTaskLinkModal
                    favorite={selectedFavorite.value}
                    open={showModal.value}
                    onClose={() => (showModal.value = false)}
                    onConfirm={handleSaveTaskLink}
                />
            ) : null}
        </div>
    );
};
