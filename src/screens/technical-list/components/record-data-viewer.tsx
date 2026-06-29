import { Copy01Icon } from "@hugeicons/core-free-icons";
import { Show } from "solid-js";

import { Alert } from "@/components/ui/alert";
import { IconButton } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { t } from "@/utils/i18n-page";

interface RecordDataViewerProps {
  data: Record<string, unknown> | null;
  loading: boolean;
  error: string | null;
}

export const RecordDataViewer = (props: RecordDataViewerProps) => {
  const { copyToClipboard } = useCopyToClipboard();

  const handleCopy = (event: MouseEvent) => {
    const jsonString = JSON.stringify(props.data, null, 2);
    const target = event.currentTarget as HTMLElement;
    copyToClipboard(jsonString, target);
  };

  return (
    <Show
      when={!props.loading}
      fallback={
        <Alert
          title={t("technical_list.record_data.loading")}
          color="info"
          variant="outline"
          class="items-start"
        >
          <span class="text-sm">{t("technical_list.record_data.please_wait")}</span>
        </Alert>
      }
    >
      <Show
        when={!props.error}
        fallback={
          <Alert color="error" variant="outline" class="items-start">
            <span class="text-sm">{props.error}</span>
          </Alert>
        }
      >
        <Show
          when={props.data}
          fallback={
            <Alert color="warning" variant="outline" class="items-start">
              <span class="text-sm">{t("common.no_data")}</span>
            </Alert>
          }
        >
          <div class="space-y-3">
            <div class="relative">
              <IconButton
                label={t("technical_list.record_data.copy_json")}
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                class="absolute inset-e-3 top-3 bg-base-100/80 shadow-sm backdrop-blur-sm"
                icon={
                  <HugeiconsIcon
                    icon={Copy01Icon}
                    size={14}
                    color="currentColor"
                    strokeWidth={1.6}
                  />
                }
              />
              <pre class="mt-2 max-h-105 overflow-auto rounded-lg border border-base-300 bg-base-200/50 p-3 text-xs/6 text-base-content">
                {JSON.stringify(props.data, null, 2)}
              </pre>
            </div>
          </div>
        </Show>
      </Show>
    </Show>
  );
};
