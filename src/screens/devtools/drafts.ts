import { createMemo } from "solid-js";
import { createStore } from "solid-js/store";

import { t } from "@/services/i18n-service";
import { formatJsonWithCommands } from "@/utils/command-utils";
import { ERROR_NOTIFICATION_TIMEOUT, showNotification } from "@/utils/notifications";
import { validateJSON } from "@/utils/query-validation";

/** Unsent input of the mutation tabs; kept across tab switches and filled by history restore. */
export interface Drafts {
  write: string;
  create: string;
  method: string;
}

const [drafts, setDrafts] = createStore<Drafts>({ write: "", create: "", method: "" });

export { drafts };

export const setDraft = (key: keyof Drafts, value: string) => setDrafts(key, value);

/** JSON editor state bound to a draft: the draft is the only copy of the text. */
export const createJsonDraft = (key: "write" | "create") => {
  const value = () => drafts[key];
  const setValue = (next: string) => setDrafts(key, next);
  const validation = createMemo(() => validateJSON(value()));
  const isEmpty = () => !value().trim();

  const format = () => {
    if (isEmpty()) {
      showNotification(t("devtools.notifications.no_data_to_format"), "warning");
      return;
    }
    try {
      setValue(formatJsonWithCommands(value()));
    } catch {
      showNotification(
        t("devtools.notifications.cannot_format_invalid"),
        "error",
        ERROR_NOTIFICATION_TIMEOUT,
      );
    }
  };

  return { value, setValue, validation, isEmpty, format, clear: () => setValue("") };
};
