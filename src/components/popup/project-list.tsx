import { usePopup } from "@/contexts/popup-signals-hook"
import { ProjectItem } from "./project-item"

const EmptyState = () => (
    <div className="no-favorites">
        <p>You have no favorite projects</p>
        <p>
            Click on the star icon next to the project name to add it to your
            favorites
        </p>
        <a target="_blank" href="https://www.odoo.sh/project">
            Take me to Odoo.sh projects page
        </a>
    </div>
)

export const ProjectList = () => {
    const { favorites, loading } = usePopup()

    if (loading) {
        return <div id="projects">Loading...</div>
    }

    if (!favorites || favorites.length === 0) {
        return <EmptyState />
    }

    return (
        <div id="projects">
            {favorites.map((favorite) => (
                <ProjectItem key={favorite.name} favorite={favorite} />
            ))}
        </div>
    )
}
