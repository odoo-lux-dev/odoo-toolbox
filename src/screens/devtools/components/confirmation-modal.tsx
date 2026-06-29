import { Show, createSignal, type Accessor, type JSX } from "solid-js";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export interface ConfirmationConfig {
  title: string | JSX.Element;
  message: string | JSX.Element;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "warning" | "danger" | "success";
  details?: string | JSX.Element;
}

export interface UseConfirmationModalReturn {
  isOpen: Accessor<boolean>;
  config: Accessor<ConfirmationConfig | null>;
  openConfirmation: (config: ConfirmationConfig) => Promise<boolean>;
  closeModal: () => void;
  handleConfirm: () => void;
  handleCancel: () => void;
}

export const useConfirmationModal = (): UseConfirmationModalReturn => {
  const [isOpen, setIsOpen] = createSignal(false);
  const [config, setConfig] = createSignal<ConfirmationConfig | null>(null);
  const [resolver, setResolver] = createSignal<((value: boolean) => void) | null>(null);

  const openConfirmation = (config: ConfirmationConfig): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfig(config);
      setResolver(() => resolve);
      setIsOpen(true);
    });
  };

  const closeModal = () => {
    setIsOpen(false);
    setResolver(null);
  };

  const handleConfirm = () => {
    const r = resolver();
    if (r) {
      r(true);
    }
    closeModal();
  };

  const handleCancel = () => {
    const r = resolver();
    if (r) {
      r(false);
    }
    closeModal();
  };

  return {
    isOpen,
    config,
    openConfirmation,
    closeModal,
    handleConfirm,
    handleCancel,
  };
};

interface ConfirmationModalProps {
  isOpen: boolean;
  config: ConfirmationConfig | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal = (props: ConfirmationModalProps): JSX.Element => {
  return (
    <Show when={props.config}>
      {(cfg) => {
        const title = () => cfg().title;
        const message = () => cfg().message;
        const confirmText = () => cfg().confirmText ?? "Confirm";
        const cancelText = () => cfg().cancelText ?? "Cancel";
        const variant = () => cfg().variant ?? "default";
        const details = () => cfg().details;
        const borderColor = () =>
          variant() === "warning"
            ? "border-s-4 border-s-warning"
            : variant() === "danger"
              ? "border-s-4 border-s-error"
              : variant() === "success"
                ? "border-s-4 border-s-success"
                : "";
        const color = () =>
          variant() === "warning"
            ? "warning"
            : variant() === "danger"
              ? "error"
              : variant() === "success"
                ? "success"
                : "primary";

        return (
          <Modal
            open={props.isOpen}
            onClose={props.onCancel}
            title={title()}
            description={message()}
            size="lg"
            boxClass={`border border-base-300 ${borderColor()}`}
            footer={
              <>
                <Button class="flex-1" onClick={props.onCancel} type="button" variant="outline">
                  {cancelText()}
                </Button>
                <Button
                  class="flex-1"
                  onClick={props.onConfirm}
                  type="button"
                  autofocus
                  color={color()}
                >
                  {confirmText()}
                </Button>
              </>
            }
          >
            <Show when={details()}>
              <div class="mt-4">
                <details class="rounded-md border border-base-300 bg-base-200 px-3 py-2">
                  <summary class="cursor-pointer text-xs text-base-content/70 select-none hover:text-base-content">
                    Show details
                  </summary>
                  <pre class="mt-3 overflow-x-auto rounded-md bg-base-300/60 p-3 font-mono text-xs whitespace-pre-wrap text-base-content/70">
                    {details()}
                  </pre>
                </details>
              </div>
            </Show>
          </Modal>
        );
      }}
    </Show>
  );
};
