import { Button } from "@/components/ui/button";

import { usePopup } from "@/contexts/popup-signals-hook";
import { ProjectItem } from "./project-item";

const EmptyState = () => (
    <div className="flex flex-col items-center gap-2 p-4 text-center">
        <p className="text-sm font-medium">You have no favorite projects</p>
        <p className="text-sm opacity-80">
            Click on the star icon next to the project name to add it to your
            favorites
        </p>
        <Button
            size="sm"
            color="primary"
            className="w-fit"
            onClick={() =>
                window.open(
                    "https://www.odoo.sh/project",
                    "_blank",
                    "noopener,noreferrer",
                )
            }
        >
            Take me to Odoo.sh projects page
        </Button>
    </div>
);

export const ProjectList = () => {
    const { favorites, loading } = usePopup();

    if (loading) {
        return (
            <div
                id="projects"
                className="flex items-center gap-2 text-sm opacity-80"
            >
                <span className="loading loading-spinner loading-sm" />
                <span>Loading favorites...</span>
            </div>
        );
    }

    if (!favorites || favorites.length === 0) {
        return <EmptyState />;
    }

    return (
        <div id="projects" className="flex flex-col">
            {favorites.map((favorite) => (
                <ProjectItem key={favorite.name} favorite={favorite} />
            ))}
        </div>
    );
};
