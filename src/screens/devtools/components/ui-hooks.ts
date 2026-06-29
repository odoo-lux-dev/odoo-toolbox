import { createSignal } from "solid-js";

import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { executeQuery, setRpcQuery } from "@/screens/devtools/devtools-signals";
import { t } from "@/services/i18n-service";
import { Logger } from "@/services/logger";
import { odooRpcService } from "@/services/odoo-rpc-service";
import { GetCurrentPageResult } from "@/types";
import { copyText } from "@/utils/clipboard";
import { getCurrentPageAndProcess } from "@/utils/current-page-utils";
import { ERROR_NOTIFICATION_TIMEOUT, showNotification } from "@/utils/notifications";

export const useContextMenu = () => {
  const { copyToClipboard } = useCopyToClipboard();

  const copyToClipboardWithFallback = async (text: string, fallbackElement?: HTMLElement) => {
    if (fallbackElement) {
      copyToClipboard(text, fallbackElement);
    } else {
      const success = await copyText(text);
      if (success) {
        showNotification(t("common.copied_to_clipboard"), "success");
      } else {
        showNotification(t("common.failed_to_copy"), "error", ERROR_NOTIFICATION_TIMEOUT);
      }
    }
  };

  const extractRelationIds = (value: unknown): string[] => {
    if (Array.isArray(value)) {
      if (value.length === 2 && typeof value[0] === "number" && typeof value[1] === "string") {
        return [value[0].toString()];
      }

      return value
        .map((item) => {
          if (typeof item === "number") return item.toString();
          if (typeof item === "object" && item && item !== null && "id" in item) {
            return (item as { id: number }).id.toString();
          }
          return item.toString();
        })
        .filter(Boolean);
    } else if (typeof value === "object" && value && value !== null && "id" in value) {
      return [(value as { id: number }).id.toString()];
    } else if (typeof value === "number") {
      return [value.toString()];
    }
    return [];
  };

  return {
    copyToClipboardWithFallback,
    extractRelationIds,
  };
};

interface Position {
  top: number;
  left: number;
}

export const usePortalTooltip = () => {
  const [isVisible, setIsVisible] = createSignal(false);
  const [position, setPosition] = createSignal<Position>({ top: 0, left: 0 });
  const [anchorEl, setAnchorEl] = createSignal<HTMLDivElement | null>(null);
  const [tooltipEl, setTooltipEl] = createSignal<HTMLDivElement | null>(null);

  const showTooltip = () => {
    setPosition({ top: -9999, left: -9999 });
    setIsVisible(true);

    setTimeout(() => {
      const anchor = anchorEl();
      const tooltip = tooltipEl();
      if (anchor && tooltip) {
        const anchorRect = anchor.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();

        const positions = {
          right: {
            top: anchorRect.top - 5,
            left: anchorRect.right + 8,
          },
          left: {
            top: anchorRect.top - 5,
            left: anchorRect.left - tooltipRect.width - 8,
          },
          bottom: {
            top: anchorRect.bottom + 8,
            left: anchorRect.left,
          },
          top: {
            top: anchorRect.top - tooltipRect.height - 8,
            left: anchorRect.left,
          },
        };

        const isPositionValid = (pos: Position) => {
          return (
            pos.top >= 0 &&
            pos.left >= 0 &&
            pos.top + tooltipRect.height <= window.innerHeight &&
            pos.left + tooltipRect.width <= window.innerWidth
          );
        };

        let finalPosition = positions.right;

        if (isPositionValid(positions.right)) {
          finalPosition = positions.right;
        } else if (isPositionValid(positions.left)) {
          finalPosition = positions.left;
        } else if (isPositionValid(positions.bottom)) {
          finalPosition = positions.bottom;
        } else if (isPositionValid(positions.top)) {
          finalPosition = positions.top;
        } else {
          finalPosition = positions.right;

          if (finalPosition.left + tooltipRect.width > window.innerWidth) {
            finalPosition.left = window.innerWidth - tooltipRect.width - 8;
          }
          if (finalPosition.left < 0) {
            finalPosition.left = 8;
          }

          if (finalPosition.top + tooltipRect.height > window.innerHeight) {
            finalPosition.top = window.innerHeight - tooltipRect.height - 8;
          }
          if (finalPosition.top < 0) {
            finalPosition.top = 8;
          }
        }

        setPosition(finalPosition);
      }
    }, 0);
  };

  const hideTooltip = () => {
    setIsVisible(false);
  };

  return {
    isVisible,
    position,
    anchorRef: setAnchorEl,
    tooltipRef: setTooltipEl,
    showTooltip,
    hideTooltip,
  };
};

interface GetCurrentPageOptions {
  showNotifications?: boolean;
  autoExecute?: boolean;
  onSuccess?: (result: GetCurrentPageResult) => void;
  onError?: (error: Error) => void;
}

/**
 * Hook pour récupérer et appliquer les informations de la page Odoo actuelle
 */
export const useGetCurrentPage = () => {
  const getAndApplyCurrentPage = async (options: GetCurrentPageOptions = {}) => {
    const { showNotifications = true, autoExecute = false, onSuccess, onError } = options;

    try {
      const result = await getCurrentPageAndProcess(
        () => odooRpcService.getCurrentPageInfo(),
        showNotifications ? showNotification : undefined,
      );

      if (result) {
        setRpcQuery({
          limit: 80,
          offset: 0,
          orderBy: "",
          selectedFields: [],
          ...result.updates,
        });

        if (autoExecute) {
          try {
            await executeQuery(true);
          } catch (executeError) {
            Logger.error("Error executing automatic query:", executeError);
            if (showNotifications && showNotification) {
              showNotification(
                t("devtools.notifications.failed_auto_search"),
                "error",
                ERROR_NOTIFICATION_TIMEOUT,
              );
            }
          }
        }

        onSuccess?.(result);
        return result;
      } else {
        onError?.(new Error("No model found on current page"));
        return null;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error : new Error("Failed to get current page information");
      onError?.(errorMessage);
      return null;
    }
  };

  return { getAndApplyCurrentPage };
};
