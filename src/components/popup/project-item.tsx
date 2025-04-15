import { Favorite } from "@/utils/types"
import { RightArrowIcon } from "@/components/icons/right-arrow-icon"

export const ProjectItem = ({ favorite }: { favorite: Favorite }) => {
  const handleClick = (event: MouseEvent) => {
    if (
      event.button === 0 &&
      !event.ctrlKey &&
      !event.shiftKey &&
      !event.altKey
    ) {
      // Left Click only without any modifiers
      event.preventDefault()
      chrome.tabs.update({
        url: `https://www.odoo.sh/project/${favorite.name}`,
      })
      // Close the popup once we click on the link
      window.close()
    }
  }

  return (
    <div className="x-odoo-favorite-popup-row">
      <a
        href={`https://www.odoo.sh/project/${favorite.name}`}
        onClick={handleClick}
      >
        <span className="x-odoo-favorite-popup-row-text">
          {favorite.display_name}
        </span>
        <span className="x-odoo-favorite-popup-row-arrow-icon">
          <RightArrowIcon />
        </span>
      </a>
    </div>
  )
}
