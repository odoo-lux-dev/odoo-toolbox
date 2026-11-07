import {
  Alert02Icon,
  CheckmarkCircle02Icon,
  Delete02Icon,
  HelpCircleIcon,
} from "@hugeicons/core-free-icons";
import { createSignal, Show, type JSX } from "solid-js";

import { Button, type ButtonProps } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Modal, type ModalIconTone } from "@/components/ui/modal";
import { t } from "@/utils/i18n-page";

type ConfirmVariant = "default" | "warning" | "danger" | "success";

const VARIANTS = {
  default: { icon: HelpCircleIcon, tone: "primary", color: "primary" },
  warning: { icon: Alert02Icon, tone: "warning", color: "warning" },
  danger: { icon: Delete02Icon, tone: "error", color: "error" },
  success: { icon: CheckmarkCircle02Icon, tone: "success", color: "success" },
} as const satisfies Record<
  ConfirmVariant,
  { icon: unknown; tone: ModalIconTone; color: NonNullable<ButtonProps["color"]> }
>;

export interface ConfirmOptions {
  title: JSX.Element;
  message: JSX.Element;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
}

interface PendingConfirm {
  options: ConfirmOptions;
  resolve: (confirmed: boolean) => void;
}

/** One dialog per app: `confirm()` can be called from anywhere once `<ConfirmDialogHost />` is mounted. */
const [pending, setPending] = createSignal<PendingConfirm | null>(null);

const settle = (confirmed: boolean) => {
  pending()?.resolve(confirmed);
  setPending(null);
};

export const confirm = (options: ConfirmOptions): Promise<boolean> =>
  new Promise((resolve) => {
    settle(false);
    setPending({ options, resolve });
  });

export const ConfirmDialogHost = () => (
  <Show when={pending()}>
    {(request) => {
      const options = () => request().options;
      const variant = () => VARIANTS[options().variant ?? "default"];
      return (
        <Modal
          open
          onClose={() => settle(false)}
          icon={<HugeiconsIcon icon={variant().icon} size={18} strokeWidth={1.8} />}
          iconTone={variant().tone}
          title={options().title}
          description={options().message}
          size="lg"
          footer={
            <>
              <Button class="flex-1" onClick={() => settle(false)} type="button" variant="outline">
                {options().cancelText ?? t("common.cancel")}
              </Button>
              <Button
                class="flex-1"
                onClick={() => settle(true)}
                type="button"
                autofocus
                color={variant().color}
              >
                {options().confirmText ?? t("common.confirm")}
              </Button>
            </>
          }
        />
      );
    }}
  </Show>
);
