import { HugeiconsIcon } from "@hugeicons/react";
import { DragDropVerticalIcon } from "@hugeicons/core-free-icons";

export const FavoriteDragHandler = () => (
    <div className="cursor-grab active:cursor-grabbing">
        <HugeiconsIcon
            icon={DragDropVerticalIcon}
            size={18}
            color="currentColor"
            strokeWidth={4}
        />
    </div>
);
