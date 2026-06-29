import { createEffect, createSignal, splitProps, Show, type JSX } from "solid-js";

let modalIdCounter = 0;
const useId = () => `solid-modal-${++modalIdCounter}`;
import { Cancel01Icon } from "@hugeicons/core-free-icons";

import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";

export type DaisyModalPlacement = "top" | "middle" | "bottom" | "start" | "end";
export type DaisyModalSize = "sm" | "md" | "lg" | "xl" | "full";

interface DaisyModalProps {
  open: boolean;
  onClose?: () => void;
  title?: JSX.Element;
  description?: JSX.Element;
  children?: JSX.Element;
  footer?: JSX.Element;
  placement?: DaisyModalPlacement;
  size?: DaisyModalSize;
  class?: string;
  boxClass?: string;
  showCloseButton?: boolean;
}

const placementClassMap: Record<DaisyModalPlacement, string> = {
  top: "modal-top",
  middle: "modal-middle",
  bottom: "modal-bottom",
  start: "modal-start",
  end: "modal-end",
};

const sizeClassMap: Record<DaisyModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-full",
};

export const Modal = (props: DaisyModalProps) => {
  const [local] = splitProps(props, [
    "open",
    "onClose",
    "title",
    "description",
    "children",
    "footer",
    "placement",
    "size",
    "class",
    "boxClass",
    "showCloseButton",
  ]);
  const [dialogRef, setDialogRef] = createSignal<HTMLDialogElement>();
  const titleId = useId();
  const descriptionId = useId();
  const placement = () => local.placement ?? "middle";
  const size = () => local.size ?? "md";
  const showCloseButton = () => local.showCloseButton ?? true;

  createEffect(() => {
    const dialog = dialogRef();
    if (!dialog) return;
    if (local.open && !dialog.open) dialog.showModal();
    if (!local.open && dialog.open) dialog.close();
  });

  const handleClose = () => local.onClose?.();

  return (
    <dialog
      ref={setDialogRef}
      class={`modal ${placementClassMap[placement()]} ${local.class ?? ""}`}
      aria-labelledby={local.title ? titleId : undefined}
      aria-describedby={local.description ? descriptionId : undefined}
      onClose={handleClose}
      onCancel={handleClose}
    >
      <div class={`modal-box ${sizeClassMap[size()]} ${local.boxClass ?? ""}`}>
        <Show when={showCloseButton()}>
          <form method="dialog">
            <button
              class="btn absolute inset-e-2 top-2 btn-circle btn-ghost btn-sm"
              aria-label="Close"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={16} color="currentColor" strokeWidth={2} />
            </button>
          </form>
        </Show>
        <Show when={local.title}>
          <h3 id={titleId} class="text-lg font-bold">
            {local.title}
          </h3>
        </Show>
        <Show when={local.description}>
          <p id={descriptionId} class="py-2 text-sm opacity-80">
            {local.description}
          </p>
        </Show>
        <Show when={local.children}>
          <div>{local.children}</div>
        </Show>
        <Show when={local.footer}>
          <div class="modal-action">{local.footer}</div>
        </Show>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button aria-label="Close">close</button>
      </form>
    </dialog>
  );
};
