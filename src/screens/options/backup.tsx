import { Download01Icon, Upload01Icon } from "@hugeicons/core-free-icons";
import { createSignal, Show } from "solid-js";

import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { configurationService } from "@/services/configuration-service";
import { t } from "@/services/i18n-service";
import { Logger } from "@/services/logger";
import { validateConfigFile } from "@/utils/config-validation";

export const BackupControls = () => {
  const [status, setStatus] = createSignal<{
    message: string;
    class: string;
  } | null>(null);
  const [fileInputRef, setFileInputRef] = createSignal<HTMLInputElement | null>(null);

  const handleExport = async () => {
    setStatus({
      message: t("options.backup.exporting"),
      class: "text-sm text-info",
    });
    try {
      const config = await configurationService.exportConfiguration();
      const blob = new Blob([JSON.stringify(config, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const date = new Date().toISOString().split("T")[0];
      a.download = `odoo-toolbox-config-${date}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus(null);
    } catch (error) {
      Logger.error("An error occured during the export:", error);
      setStatus({
        message: t("options.backup.error_export", [
          error instanceof Error ? error.message : t("common.unknown_error"),
        ]),
        class: "text-sm text-error",
      });
    }
  };

  const handleImportClick = () => {
    fileInputRef()?.click();
  };

  const handleFileChange = async (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    setStatus({
      message: t("options.backup.importing"),
      class: "text-sm text-info",
    });

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result;
        if (typeof content !== "string") {
          throw new Error(t("options.backup.failed_read"));
        }
        const config = JSON.parse(content);
        const validationResult = validateConfigFile(config);
        if (!validationResult.valid) {
          throw new Error(t("options.backup.invalid_config", [validationResult.message]));
        }
        await configurationService.importConfiguration(config);
        setStatus({
          message: t("options.backup.success"),
          class: "text-sm text-success",
        });
        setTimeout(() => setStatus(null), 3000);
      } catch (parseError) {
        Logger.error("An error occured during file process:", parseError);
        setStatus({
          message: t("options.backup.error_import", [
            parseError instanceof Error ? parseError.message : t("options.backup.invalid_format"),
          ]),
          class: "text-sm text-error",
        });
      }
    };
    reader.readAsText(file);

    if (event.target) {
      (event.target as HTMLInputElement).value = "";
    }
  };

  return (
    <div class="flex w-full flex-col items-center gap-2">
      <Show when={status()}>
        <div class={status()!.class}>{status()!.message}</div>
      </Show>
      <div class="flex w-full gap-2">
        <Button
          variant="ghost"
          size="sm"
          class="flex-1 gap-2 border border-base-content/15"
          onClick={handleExport}
        >
          <HugeiconsIcon icon={Download01Icon} size={14} color="currentColor" strokeWidth={1.6} />
          {t("options.backup.export")}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          class="flex-1 gap-2 border border-base-content/15"
          onClick={handleImportClick}
        >
          <HugeiconsIcon icon={Upload01Icon} size={14} color="currentColor" strokeWidth={1.6} />
          {t("options.backup.restore")}
        </Button>
        <input
          type="file"
          accept=".json"
          class="hidden"
          ref={setFileInputRef}
          onInput={handleFileChange}
        />
      </div>
    </div>
  );
};
