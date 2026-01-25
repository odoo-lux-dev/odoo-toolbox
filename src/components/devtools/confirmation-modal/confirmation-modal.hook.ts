import { useCallback, useState } from "preact/hooks";
import {
    ConfirmationConfig,
    UseConfirmationModalReturn,
} from "./confirmation-modal.types";

export const useConfirmationModal = (): UseConfirmationModalReturn => {
    const [isOpen, setIsOpen] = useState(false);
    const [config, setConfig] = useState<ConfirmationConfig | null>(null);
    const [resolver, setResolver] = useState<((value: boolean) => void) | null>(
        null,
    );

    const openConfirmation = useCallback(
        (config: ConfirmationConfig): Promise<boolean> => {
            return new Promise((resolve) => {
                setConfig(config);
                setResolver(() => resolve);
                setIsOpen(true);
            });
        },
        [],
    );

    const closeModal = useCallback(() => {
        setIsOpen(false);
        setResolver(null);
    }, []);

    const handleConfirm = useCallback(() => {
        if (resolver) {
            resolver(true);
        }
        closeModal();
    }, [resolver, closeModal]);

    const handleCancel = useCallback(() => {
        if (resolver) {
            resolver(false);
        }
        closeModal();
    }, [resolver, closeModal]);

    return {
        isOpen,
        config,
        openConfirmation,
        closeModal,
        handleConfirm,
        handleCancel,
    };
};
