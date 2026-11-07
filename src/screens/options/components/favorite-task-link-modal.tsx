import { createSignal, Show } from "solid-js";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { t } from "@/services/i18n-service";
import type { Favorite } from "@/types";
import { isUrlOrEmpty } from "@/utils/constants";

/** Mounted while editing: the form starts from the favorite on each opening. */
export const FavoriteTaskLinkModal = (props: {
  favorite: Favorite;
  onClose: () => void;
  onConfirm: (name: string, taskLink: string) => Promise<void>;
}) => {
  const [taskLink, setTaskLink] = createSignal(props.favorite.task_link || "");
  const [hasError, setHasError] = createSignal(false);

  const handleSave = async () => {
    if (!isUrlOrEmpty(taskLink())) {
      setHasError(true);
      return;
    }
    await props.onConfirm(props.favorite.name, taskLink());
    props.onClose();
  };

  return (
    <Modal
      open
      onClose={props.onClose}
      title={t("options.favorites.task_link_title", [props.favorite.display_name])}
      description={t("options.favorites.task_link_desc")}
      footer={
        <>
          <Button id="cancel-task-link" size="sm" variant="ghost" onClick={props.onClose}>
            {t("common.cancel")}
          </Button>
          <Button id="save-task-link" size="sm" color="primary" onClick={handleSave}>
            {t("common.save")}
          </Button>
        </>
      }
    >
      <div class="flex flex-col gap-3">
        <Input
          ref={(el) => queueMicrotask(() => el.focus())}
          type="text"
          value={taskLink()}
          id="task-link-input"
          class={hasError() ? "input-error" : ""}
          placeholder={t("options.favorites.task_link_placeholder")}
          fullWidth
          onInput={(e) => {
            setTaskLink(e.currentTarget.value);
            setHasError(false);
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
        />
        <Show when={hasError()}>
          <Alert color="error" variant="soft" class="text-sm">
            {t("options.favorites.link_incorrect")}
          </Alert>
        </Show>
      </div>
    </Modal>
  );
};
