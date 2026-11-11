import { MagicWand05Icon } from "@hugeicons/core-free-icons";
import { createSignal } from "solid-js";

import { IconButton } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { Input } from "@/components/ui/input";
import { RailField } from "@/screens/devtools/components/devtools-ui";
import { queryStore, setQueryStore } from "@/screens/devtools/devtools-signals";
import { t } from "@/services/i18n-service";
import { Logger } from "@/services/logger";
import { odooRpcService } from "@/services/odoo-rpc-service";
import { defaultRpcContext, parseRpcContext } from "@/utils/context-utils";
import { errorMessage } from "@/utils/error-message";
import { ERROR_NOTIFICATION_TIMEOUT, showNotification } from "@/utils/notifications";

export const ContextField = (props: { disabled: boolean }) => {
  const [loading, setLoading] = createSignal(false);
  const validation = () => parseRpcContext(queryStore.context || "");
  const error = () =>
    validation().isValid
      ? ""
      : t("services.invalid_context", [validation().error || t("services.invalid_json")]);

  const fillDefaultContext = async () => {
    if (loading()) return;
    setLoading(true);
    try {
      const [companies, languages] = await Promise.all([
        odooRpcService.searchRead({ model: "res.company", fields: ["id"] }),
        odooRpcService.searchRead({ model: "res.lang", fields: ["code"] }),
      ]);
      setQueryStore("context", JSON.stringify(defaultRpcContext(companies, languages)));
    } catch (caught) {
      Logger.error("Failed to set default context", caught);
      showNotification(
        errorMessage(caught, t("common.unknown_error")),
        "error",
        ERROR_NOTIFICATION_TIMEOUT,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <RailField
      label={t("devtools.sidebar.context")}
      helpText={error() || t("devtools.sidebar.context_help")}
      helpTone={error() ? "error" : "neutral"}
    >
      <div class="flex items-center gap-1">
        <Input
          type="text"
          value={queryStore.context}
          onInput={(e) => setQueryStore("context", e.currentTarget.value)}
          placeholder={t("devtools.sidebar.context_placeholder")}
          size="sm"
          fullWidth
          class="min-w-0 flex-1 font-mono"
          spellcheck={false}
          color={error() ? "error" : undefined}
          disabled={props.disabled || loading()}
        />
        <IconButton
          class="shrink-0 text-ink-3 hover:text-ink"
          label={t("devtools.sidebar.set_default_context")}
          type="button"
          size="sm"
          variant="ghost"
          square
          circle={false}
          disabled={props.disabled || loading()}
          loading={loading()}
          onClick={fillDefaultContext}
          icon={
            loading() ? null : <HugeiconsIcon icon={MagicWand05Icon} size={16} strokeWidth={1.6} />
          }
        />
      </div>
    </RailField>
  );
};
