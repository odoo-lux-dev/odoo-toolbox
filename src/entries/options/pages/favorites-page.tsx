import { useState, useEffect, useRef, useMemo } from "preact/hooks"
import { createSwapy, Swapy, utils } from "swapy"
import { setProjectTaskUrl, setFavoritesProjects } from "@/utils/storage"
import { Favorite } from "@/utils/types"
import { useOptions } from "@/components/options/options-context"
import { FavoriteRow } from "@/components/options/favorite-row"
import { FavoriteTaskLinkModal } from "@/components/options/favorite-task-link-modal"

export const FavoritesPage = () => {
  const { favorites, loading } = useOptions()
  const [showModal, setShowModal] = useState(false)
  const [selectedFavorite, setSelectedFavorite] = useState<Favorite | null>(
    null
  )
  const favoritesContainerRef = useRef<HTMLDivElement>(null)
  const swapy = useRef<Swapy>(null)
  const [slotItemMap, setSlotItemMap] = useState(
    utils.initSlotItemMap(favorites || [], "name")
  )
  const slottedItems = useMemo(
    () => utils.toSlottedItems(favorites || [], "name", slotItemMap),
    [favorites, slotItemMap]
  )

  useEffect(
    () =>
      utils.dynamicSwapy(
        swapy.current,
        favorites || [],
        "name",
        slotItemMap,
        setSlotItemMap
      ),
    [favorites]
  )

  useEffect(() => {
    if (favoritesContainerRef.current && !loading) {
      swapy.current = createSwapy(favoritesContainerRef.current, {
        manualSwap: true,
        dragAxis: "y",
        animation: "spring",
      })
      swapy.current.update()

      swapy.current.onSwap((event) => {
        setSlotItemMap(event.newSlotItemMap.asArray)
      })

      swapy.current.onSwapEnd(async (event) => {
        if (event.hasChanged) {
          const newOrder = event.slotItemMap.asArray
          const reorderedFavorites = newOrder
            .map((orderItem, index) => {
              const favorite = favorites?.find(
                (fav) => fav.name === orderItem.item
              )
              if (favorite) {
                return { ...favorite, sequence: index }
              }
              return favorite
            })
            .filter(
              (fav: Favorite | undefined) => fav !== undefined
            ) as Favorite[]
          await setFavoritesProjects(reorderedFavorites)
        }

        swapy.current?.update()
      })
    }

    return () => {
      swapy.current?.destroy()
    }
  }, [loading, favorites])

  const handleEditTaskLink = (favorite: Favorite) => {
    setSelectedFavorite(favorite)
    setShowModal(true)
  }

  const handleSaveTaskLink = async (name: string, taskLink: string) => {
    await setProjectTaskUrl(name, taskLink)
    setShowModal(false)
  }

  const handleEditName = async (name: string, newDisplayName: string) => {
    if (!favorites) return

    const updatedFavorites = favorites.map((fav) =>
      fav.name === name ? { ...fav, display_name: newDisplayName } : fav
    )

    await setFavoritesProjects(updatedFavorites)
  }

  const handleDelete = async (name: string) => {
    if (!favorites) return

    const updatedFavorites = favorites.filter((fav) => fav.name !== name)
    await setFavoritesProjects(updatedFavorites)
  }

  const handleEdition = (isEditing: boolean) => {
    swapy.current?.enable(!isEditing)
  }

  if (loading) {
    return <div>Loading favorites...</div>
  }

  if (!favorites?.length) {
    return (
      <div className="x-odoo-options-page x-odoo-options-page-no-favorites">
        <h2 className="x-odoo-options-page-option-title">Favorite projects</h2>
        <p>You have no favorite projects</p>
        <p>
          Click on the star icon next to the project name to add it to your
          favorites
        </p>
        <a
          className="x-odoo-options-page-link"
          target="_blank"
          href="https://www.odoo.sh/project"
        >
          Take me to Odoo.sh projects page
        </a>
      </div>
    )
  }

  return (
    <div className="x-odoo-options-page">
      <h2 className="x-odoo-options-page-option-title">Favorite projects</h2>
      <div
        className="x-odoo-options-page-favorite-rows"
        ref={favoritesContainerRef}
      >
        {slottedItems.map(({ slotId, itemId, item: favorite }, index) =>
          favorite ? (
            <FavoriteRow
              key={index}
              slotId={slotId}
              itemId={itemId}
              favorite={favorite}
              onEditName={handleEditName}
              onEditTaskLink={handleEditTaskLink}
              onDelete={handleDelete}
              onEdition={handleEdition}
            />
          ) : null
        )}
      </div>

      {showModal && selectedFavorite && (
        <FavoriteTaskLinkModal
          favorite={selectedFavorite}
          onClose={() => setShowModal(false)}
          onSave={handleSaveTaskLink}
        />
      )}
    </div>
  )
}
