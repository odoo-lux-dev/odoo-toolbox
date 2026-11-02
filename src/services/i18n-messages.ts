export const I18N_GET_MESSAGES = "i18n:get-messages";

export interface I18nGetMessagesRequest {
  type: typeof I18N_GET_MESSAGES;
  locale: string;
}

export type I18nGetMessagesResponse =
  | { ok: true; messages: Record<string, string> }
  | { ok: false; error: string };
