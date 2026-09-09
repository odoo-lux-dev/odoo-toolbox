import { Logger } from "@/services/logger";
import { t } from "@/utils/i18n-page";

const LOG_URL_REGEX = /^https:\/\/[a-z0-9]+\.odoo\.com\/paas\/build\/\d+\/logs\/\w+\?token=/;
const LOG_URL_PARTS_REGEX = /\/paas\/build\/(\d+)\/logs\/(\w+)/;

const BUTTON_CLASS = "x-odoo-sh-download-full-log";
const BUTTON_LABEL_CLASS = "x-odoo-sh-download-full-log-label";
const TOPBAR_SELECTOR = ".o_topbar div.o_filter";

let currentLogUrl: string | null = null;
let downloadButton: HTMLButtonElement | null = null;

const findLogUrlFromLogViewerProps = (): string | null => {
  const odoo = (window as unknown as Record<string, unknown>).odoo;
  const props =
    odoo && typeof odoo === "object" ? (odoo as Record<string, unknown>).logViewerProps : undefined;
  const logsUrl =
    props && typeof props === "object" ? (props as Record<string, unknown>).logsUrl : undefined;
  return typeof logsUrl === "string" && logsUrl ? logsUrl : null;
};

/**
 * Recovers the raw log URL from the browser's own Resource Timing entries.
 * Used on the embedded logs panel (branches/build SPA), which has no global:
 * we look for a request the panel already made matching the logs endpoint.
 */
const findLogUrlFromResourceTimings = (): string | null => {
  const entries = performance.getEntriesByType("resource");
  for (let i = entries.length - 1; i >= 0; i--) {
    if (LOG_URL_REGEX.test(entries[i].name)) return entries[i].name;
  }
  return null;
};

const findLogUrl = (): string | null =>
  findLogUrlFromLogViewerProps() || findLogUrlFromResourceTimings();

const getLogFileName = (url: string): string => {
  const match = url.match(LOG_URL_PARTS_REGEX);
  const buildId = match ? match[1] : "build";
  const logName = match ? match[2] : "log";
  return `odoo_sh_${logName}_${buildId}.log`;
};

/**
 * Downloads the complete raw log file instead of relying on odoo.sh's own
 * viewer, which only renders one chunk at a time and drops lines that scroll
 * out of view. The `range: bytes=0-` header is required by the endpoint
 */
const downloadFullLog = async (url: string): Promise<void> => {
  const button = document.querySelector<HTMLButtonElement>(`.${BUTTON_CLASS}`);
  const setLabel = (label: string): void => {
    const labelSpan = button?.querySelector<HTMLSpanElement>(`.${BUTTON_LABEL_CLASS}`);
    if (labelSpan) labelSpan.textContent = label;
  };

  const restoreLabel = (): void => setLabel(t("page_features.sh_download_log.download"));

  try {
    setLabel(t("page_features.sh_download_log.downloading"));
    const response = await fetch(url, { headers: { accept: "*/*", range: "bytes=0-" } });
    if (!response.ok && response.status !== 206) {
      throw new Error(`HTTP ${response.status}`);
    }
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = getLogFileName(url);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    setLabel(t("page_features.sh_download_log.downloaded"));
    setTimeout(restoreLabel, 2000);
  } catch (error) {
    Logger.error("Failed to download the full log", error);
    setLabel(t("page_features.sh_download_log.download_failed"));
    setTimeout(restoreLabel, 3000);
  }
};

const createDownloadButton = (): HTMLButtonElement => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `btn shadow-none text-white ${BUTTON_CLASS}`;
  button.title = t("page_features.sh_download_log.download_hint");

  const icon = document.createElement("i");
  icon.className = "fa fa-download";

  const label = document.createElement("span");
  label.className = `${BUTTON_LABEL_CLASS} ms-2`;
  label.textContent = t("page_features.sh_download_log.download");

  button.append(icon, label);
  button.addEventListener("click", () => {
    if (currentLogUrl) downloadFullLog(currentLogUrl);
  });
  return button;
};

/**
 * Inserts the "download full log" button into the log viewer header before the
 * filter/search input. The button is created once and re-inserted only when it
 * is not currently in the DOM (e.g. the SPA unmounted the log viewer).
 */
const placeButtonInTopbar = (): void => {
  if (!currentLogUrl) return;
  const topbar = document.querySelector<HTMLDivElement>(TOPBAR_SELECTOR);
  if (!topbar) return;
  if (!downloadButton) downloadButton = createDownloadButton();
  if (downloadButton.isConnected) return;
  topbar.before(downloadButton);
};

const handleShDownloadFullLog = (): (() => void) => {
  const updateLogUrl = (): void => {
    const url = findLogUrl();
    if (url) currentLogUrl = url;
    placeButtonInTopbar();
  };

  updateLogUrl();

  let performanceObserver: PerformanceObserver | null = null;
  if (typeof PerformanceObserver !== "undefined") {
    try {
      performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (let i = entries.length - 1; i >= 0; i--) {
          if (LOG_URL_REGEX.test(entries[i].name)) {
            updateLogUrl();
            break;
          }
        }
      });
      performanceObserver.observe({ type: "resource", buffered: true });
    } catch {
      performanceObserver = null;
    }
  }

  return () => performanceObserver?.disconnect();
};

export { handleShDownloadFullLog };
