import {
  I18N_GET_MESSAGES,
  type I18nGetMessagesRequest,
  type I18nGetMessagesResponse,
} from "@/services/extension-messages";
import { Logger } from "@/services/logger";
import { createAsyncCache } from "@/utils/async-cache";

/** Reads a generated `_locales/<locale>/messages.json` file as a `key -> message` map. */
export const loadMessages = createAsyncCache(async (locale) => {
  const response = await fetch(browser.runtime.getURL(`_locales/${locale}/messages.json` as never));
  if (!response.ok) {
    throw new Error(`Failed to load messages for locale "${locale}"`);
  }
  const messages = (await response.json()) as Record<string, { message?: string }>;
  return Object.fromEntries(
    Object.entries(messages).map(([key, value]) => [key, value.message ?? key]),
  );
});

export const handleI18nMessage = (
  request: Partial<I18nGetMessagesRequest>,
  sendResponse: (response: I18nGetMessagesResponse) => void,
): boolean => {
  if (request?.type !== I18N_GET_MESSAGES) return false;

  if (!request.locale) {
    sendResponse({ ok: false, error: "Missing locale" });
    return true;
  }

  loadMessages(request.locale)
    .then((messages) => sendResponse({ ok: true, messages }))
    .catch((error: unknown) => {
      Logger.error("Failed to load locale messages", error);
      sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) });
    });

  return true;
};
