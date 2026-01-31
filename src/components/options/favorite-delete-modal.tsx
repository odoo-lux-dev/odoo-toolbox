import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Favorite } from "@/types";

export const FavoriteDeleteModal = ({
    favorite,
    open,
    onClose,
    onConfirm,
}: {
    favorite: Favorite;
    open: boolean;
    onClose: () => void;
    onConfirm: (name: string) => Promise<void>;
}) => {
    const handleConfirm = async () => {
        await onConfirm(favorite.name);
        onClose();
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Delete favorite?"
            description={`Are you sure you want to delete "${favorite.display_name}" from favorites?`}
            footer={
                <>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button color="error" onClick={handleConfirm}>
                        Delete
                    </Button>
                </>
            }
        />
    );
};
