import { AlertCircleIcon, Loading03Icon } from "@hugeicons/core-free-icons";
import { splitProps, type JSX } from "solid-js";

import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { t } from "@/utils/i18n-page";

interface EmptyStateProps {
  icon: JSX.Element;
  message: string;
}

export const EmptyState = (props: EmptyStateProps) => (
  <div class="flex flex-col items-center gap-3 py-12 shadow-sm">
    {props.icon}
    <span class="text-sm">{props.message}</span>
  </div>
);

interface ErrorStateProps {
  message: string;
}

export const ErrorState = (props: ErrorStateProps) => (
  <div class="flex flex-col items-center gap-3 py-12 shadow-sm">
    <HugeiconsIcon icon={AlertCircleIcon} size={32} color="currentColor" strokeWidth={1.6} />
    <span class="text-sm">{props.message}</span>
  </div>
);

interface LoadingStateProps {
  message?: string;
}

export const LoadingState = (props: LoadingStateProps) => {
  const [local] = splitProps(props, ["message"]);
  const message = () => local.message ?? t("technical_list.states.scanning");

  return (
    <div class="flex flex-col items-center gap-3 py-12 shadow-sm">
      <HugeiconsIcon
        icon={Loading03Icon}
        size={32}
        color="currentColor"
        strokeWidth={1.6}
        class="animate-spin"
      />
      <span class="text-sm">{message()}</span>
    </div>
  );
};
