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
    const favoritesContainerRef = useRef<HTMLDivElement>(null);
    const swapy = useRef<Swapy>(null);
    const slotItemMap = useSignal(
        utils.initSlotItemMap(favorites || [], "name"),
    );
    const slottedItems = useComputed(() =>
        utils.toSlottedItems(favorites || [], "name", slotItemMap.value),
    );

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
        }

        return () => {
            swapy.current?.destroy();
        };
    }, [loading, favorites]);

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
        swapy.current?.enable(!isEditing);
    };

    if (loading) {
        return <div>Loading favorites...</div>;
    }

    if (!favorites?.length) {
        return (
            <div className="x-odoo-options-page x-odoo-options-page-no-favorites">
                <h2 className="x-odoo-options-page-option-title">
                    Favorite projects
                </h2>
                <p>You have no favorite projects</p>
                <p>
                    Click on the star icon next to the project name to add it to
                    your favorites
                </p>
                <a
                    className="x-odoo-options-page-link"
                    target="_blank"
                    href="https://www.odoo.sh/project"
                >
                    Take me to Odoo.sh projects page
                </a>
            </div>
        );
    }

    return (
        <div className="x-odoo-options-page">
            <h2 className="x-odoo-options-page-option-title">
                Favorite projects
            </h2>
            <div
                className="x-odoo-options-page-favorite-rows"
                ref={favoritesContainerRef}
            >
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
                            />
                        ) : null,
                )}
            </div>

            {showModal.value && selectedFavorite.value && (
                <FavoriteTaskLinkModal
                    favorite={selectedFavorite.value}
                    onClose={() => (showModal.value = false)}
                    onSave={handleSaveTaskLink}
                />
            )}
        </div>
    );
};
