import { DatabaseIcon, Download01Icon, Upload01Icon } from "@hugeicons/core-free-icons";
import { createRoot, createSignal, Show } from "solid-js";

import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { IconTile } from "@/components/ui/icon-tile";
import { configurationService } from "@/services/configuration-service";
import { t } from "@/services/i18n-service";
import { Logger } from "@/services/logger";
import { parseConfigFile } from "@/utils/config-validation";
import { downloadJson } from "@/utils/download";
import { errorMessage } from "@/utils/error-message";

type BackupStatus = { message: string; tone: "info" | "success" | "error" };

const STATUS_CLASS: Record<BackupStatus["tone"], string> = {
  info: "text-info-ink",
  success: "text-success-ink",
  error: "text-error-ink",
};

const SUCCESS_DISPLAY_MS = 3000;

// Shared by the sidebar controls and the command palette.
const { status, setStatus } = createRoot(() => {
  const [status, setStatus] = createSignal<BackupStatus | null>(null);
  return { status, setStatus };
});

let clearTimer: number | undefined;
const showStatus = (next: BackupStatus | null, clearAfter?: number) => {
  clearTimeout(clearTimer);
  setStatus(next);
  if (clearAfter) clearTimer = window.setTimeout(() => setStatus(null), clearAfter);
};

export const exportConfiguration = async () => {
  showStatus({ message: t("options.backup.exporting"), tone: "info" });
  try {
    const config = await configurationService.exportConfiguration();
    downloadJson(`odoo-toolbox-config-${new Date().toISOString().split("T")[0]}.json`, config);
    showStatus(null);
  } catch (error) {
    Logger.error("An error occured during the export:", error);
    showStatus({
      message: t("options.backup.error_export", [errorMessage(error, t("common.unknown_error"))]),
      tone: "error",
    });
  }
};

const importFile = async (file: File) => {
  showStatus({ message: t("options.backup.importing"), tone: "info" });
  try {
    const result = parseConfigFile(JSON.parse(await file.text()));
    if (!result.valid) throw new Error(t("options.backup.invalid_config", [result.message]));
    await configurationService.importConfiguration(result.config);
    showStatus({ message: t("options.backup.success"), tone: "success" }, SUCCESS_DISPLAY_MS);
  } catch (error) {
    Logger.error("An error occured during file process:", error);
    showStatus({
      message: t("options.backup.error_import", [
        errorMessage(error, t("options.backup.invalid_format")),
      ]),
      tone: "error",
    });
  }
};

/** Opens the file picker and imports the chosen backup. */
export const importConfiguration = () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (file) void importFile(file);
  });
  input.click();
};

export const BackupControls = () => (
  <div class="rounded-box border border-line bg-surface-2 p-2.5">
    <div class="flex items-center gap-2">
      <IconTile>
        <HugeiconsIcon icon={DatabaseIcon} size={15} strokeWidth={1.8} />
      </IconTile>
      <div class="flex min-w-0 flex-col leading-tight">
        <strong class="text-label font-semibold">{t("options.shell.backup_title")}</strong>
        <span class="mt-0.5 text-meta text-ink-3">{t("options.shell.backup_desc")}</span>
      </div>
    </div>
    <div class="mt-2.25 grid grid-cols-2 gap-1.25">
      <Button
        variant="ghost"
        size="sm"
        class="gap-1 border-line bg-surface px-1.5 text-small"
        id="options-export-config"
        onClick={exportConfiguration}
      >
        <HugeiconsIcon icon={Download01Icon} size={12} strokeWidth={1.8} />
        {t("options.backup.export")}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        class="gap-1 border-line bg-surface px-1.5 text-small"
        id="options-import-config"
        onClick={importConfiguration}
      >
        <HugeiconsIcon icon={Upload01Icon} size={12} strokeWidth={1.8} />
        {t("options.backup.restore")}
      </Button>
    </div>
    <Show when={status()}>
      {(current) => (
        <p class={`mt-2 text-note ${STATUS_CLASS[current().tone]}`} role="status">
          {current().message}
        </p>
      )}
    </Show>
  </div>
);
