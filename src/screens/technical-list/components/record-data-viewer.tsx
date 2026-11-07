import { Copy01Icon } from "@hugeicons/core-free-icons";

import { IconButton } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { copyWithFeedback } from "@/utils/clipboard";
import { t } from "@/utils/i18n-page";

export const RecordDataViewer = (props: { data: Record<string, unknown> }) => {
  const json = () => JSON.stringify(props.data, null, 2);

  return (
    <div class="relative">
      <IconButton
        label={t("technical_list.record_data.copy_json")}
        variant="ghost"
        size="sm"
        onClick={(event) => copyWithFeedback(json(), event.currentTarget)}
        class="absolute inset-e-3 top-3 bg-base-100/80 shadow-sm backdrop-blur-sm"
        icon={<HugeiconsIcon icon={Copy01Icon} size={14} strokeWidth={1.6} />}
      />
      <pre class="max-h-105 overflow-auto rounded-lg border border-base-300 bg-base-200/50 p-3 text-xs/6 text-base-content">
        {json()}
      </pre>
    </div>
  );
};
