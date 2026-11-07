import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { createEffect, createSignal, createUniqueId, Show, type JSX } from "solid-js";

import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { IconTile, type IconTileTone } from "@/components/ui/icon-tile";
// Shared by every context, including the technical list in the Odoo page: use the
// page-world translations, never the extension i18n service (it loads wxt/storage).
import { t } from "@/utils/i18n-page";

/** Focused element, looking inside shadow roots (technical list). */
const deepActiveElement = (): HTMLElement | null => {
  let active = document.activeElement;
  while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
  return active instanceof HTMLElement ? active : null;
};

export type ModalSize = "sm" | "md" | "lg" | "xl" | "full";
export type ModalIconTone = IconTileTone;

interface ModalProps {
  open: boolean;
  onClose?: () => void;
  title?: JSX.Element;
  /** Icon shown in a tinted tile above the title. */
  icon?: JSX.Element;
  iconTone?: ModalIconTone;
  description?: JSX.Element;
  children?: JSX.Element;
  footer?: JSX.Element;
  size?: ModalSize;
  class?: string;
  boxClass?: string;
}

const sizeClassMap: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-full",
};

export const Modal = (props: ModalProps) => {
  const [dialogRef, setDialogRef] = createSignal<HTMLDialogElement>();
  const titleId = createUniqueId();
  const descriptionId = createUniqueId();

  // `showModal()` makes the rest of the page inert (focus stays in the dialog);
  // the trigger is remembered so focus goes back to it on close.
  let returnFocus: HTMLElement | null = null;

  createEffect(() => {
    const dialog = dialogRef();
    if (!dialog) return;
    if (props.open && !dialog.open) {
      returnFocus = deepActiveElement();
      dialog.showModal();
    }
    if (!props.open && dialog.open) dialog.close();
  });

  const handleClose = () => {
    const trigger = returnFocus;
    returnFocus = null;
    if (trigger?.isConnected) queueMicrotask(() => trigger.focus());
    props.onClose?.();
  };

  return (
    <dialog
      ref={setDialogRef}
      class={`modal modal-middle ${props.class ?? ""}`}
      aria-labelledby={props.title ? titleId : undefined}
      aria-describedby={props.description ? descriptionId : undefined}
      onClose={handleClose}
    >
      <div class={`modal-box ${sizeClassMap[props.size ?? "md"]} ${props.boxClass ?? ""}`}>
        <form method="dialog">
          <button
            class="btn absolute inset-e-2 top-2 btn-circle btn-ghost btn-sm"
            aria-label={t("common.close")}
          >
            <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={2} />
          </button>
        </form>
        <Show when={props.icon}>
          <IconTile size="lg" tone={props.iconTone ?? "primary"} class="mb-3">
            {props.icon}
          </IconTile>
        </Show>
        <Show when={props.title}>
          <h3 id={titleId} class="text-lg font-bold">
            {props.title}
          </h3>
        </Show>
        <Show when={props.description}>
          <p id={descriptionId} class="py-2 text-sm opacity-80">
            {props.description}
          </p>
        </Show>
        <Show when={props.children}>
          <div>{props.children}</div>
        </Show>
        <Show when={props.footer}>
          <div class="modal-action">{props.footer}</div>
        </Show>
      </div>
      {/* Pointer only: keyboard users close with Esc or the close button */}
      <form method="dialog" class="modal-backdrop">
        <button tabIndex={-1} aria-hidden="true">
          {t("common.close")}
        </button>
      </form>
    </dialog>
  );
};
