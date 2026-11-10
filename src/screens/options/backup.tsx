import { DatabaseIcon, Download01Icon, Upload01Icon } from "@hugeicons/core-free-icons";
import { createRoot, createSignal, onCleanup, onMount, Show } from "solid-js";

import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";
import { IconTile } from "@/components/ui/icon-tile";
import { StatusDot } from "@/components/ui/status";
import { syncState, type SyncState } from "@/screens/options/sync-state";
import { configurationService } from "@/services/configuration-service";
import { getLocale, t } from "@/services/i18n-service";
import { Logger } from "@/services/logger";
import { parseConfigFile } from "@/utils/config-validation";
import { downloadJson } from "@/utils/download";
import { errorMessage } from "@/utils/error-message";
import { formatRelativeTime, intlLocale } from "@/utils/relative-time";

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

const RELATIVE_TIME_REFRESH_MS = 30_000;

const SYNC_PART_LABEL = {
  settings: "options.sync.part_settings",
  favorites: "options.sync.part_favorites",
  quickDomains: "options.sync.part_quick_domains",
} as const;

const SyncStatusLine = () => {
  const [state, setState] = createSignal<SyncState>();
  const [now, setNow] = createSignal(Date.now());

  const refresh = async () => {
    const [status, synced] = await Promise.all([
      configurationService.getSyncStatus(),
      configurationService.isDataSynced(),
    ]);
    setState(syncState(status, !synced));
  };

  onMount(() => {
    void refresh();
    onCleanup(configurationService.watchSyncState(() => void refresh()));
    const timer = window.setInterval(() => setNow(Date.now()), RELATIVE_TIME_REFRESH_MS);
    onCleanup(() => clearInterval(timer));
  });

  const ago = (timestamp: number) => formatRelativeTime(timestamp, intlLocale(getLocale()), now());

  const view = (current: SyncState) => {
    switch (current.kind) {
      case "failed":
        return {
          tone: "error" as const,
          text: t("options.sync.failed", [t(SYNC_PART_LABEL[current.part]), current.message]),
        };
      case "pending":
        return {
          tone: "warning" as const,
          text: current.savedAt
            ? t("options.sync.pending_since", [ago(current.savedAt)])
            : t("options.sync.pending"),
        };
      case "synced":
        return { tone: "success" as const, text: t("options.sync.synced") };
    }
  };

  return (
    <Show when={state()}>
      {(current) => (
        <p class="mt-2" title={t("options.sync.hint")}>
          <StatusDot tone={view(current()).tone} size="caption" class="text-ink-3">
            {view(current()).text}
          </StatusDot>
        </p>
      )}
    </Show>
  );
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
    <SyncStatusLine />
    <Show when={status()}>
      {(current) => (
        <p class={`mt-2 text-note ${STATUS_CLASS[current().tone]}`} role="status">
          {current().message}
        </p>
      )}
    </Show>
  </div>
);
