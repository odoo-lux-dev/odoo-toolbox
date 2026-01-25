import { useEffect, useRef, useState } from "preact/hooks";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Favorite } from "@/types";
import { URL_CHECK_REGEX } from "@/utils/constants";

export const FavoriteTaskLinkModal = ({
    favorite,
    open,
    onClose,
    onSave,
}: {
    favorite: Favorite;
    open: boolean;
    onClose: () => void;
    onSave: (name: string, taskLink: string) => Promise<void>;
}) => {
    const [taskLink, setTaskLink] = useState(favorite.task_link || "");
    const [hasError, setHasError] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open && inputRef.current) {
            inputRef.current.focus();
        }
    }, [open]);

    useEffect(() => {
        if (open) {
            setTaskLink(favorite.task_link || "");
            setHasError(false);
        }
    }, [favorite, open]);

    const handleSave = async () => {
        const isValidUrl = URL_CHECK_REGEX.test(taskLink) || taskLink === "";
        if (!isValidUrl) {
            setHasError(true);
            return;
        }
        await onSave(favorite.name, taskLink);
        onClose();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
        if (e.key === "Enter") handleSave();
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={`Edit task link for ${favorite.display_name}`}
            description="Set a custom task link for this project."
            footer={
                <>
                    <Button
                        id="cancel-task-link"
                        color="error"
                        variant="outline"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        id="save-task-link"
                        color="primary"
                        onClick={handleSave}
                    >
                        Save
                    </Button>
                </>
            }
        >
            <div className="flex flex-col gap-3">
                <Input
                    ref={inputRef}
                    type="text"
                    value={taskLink}
                    id="task-link-input"
                    className={hasError ? "input-error" : ""}
                    placeholder="https://www.odoo.com/odoo/project.task/{{task_id}}"
                    fullWidth
                    onInput={(e) => {
                        setTaskLink(e.currentTarget.value);
                        setHasError(false);
                    }}
                    onKeyDown={handleKeyDown}
                />
                {hasError ? (
                    <Alert color="error" variant="soft" className="text-sm">
                        Link seems incorrect. Please verify.
                    </Alert>
                ) : null}
            </div>
        </Modal>
    );
};
