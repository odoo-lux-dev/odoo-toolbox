import { createSignal, createEffect, Show } from "solid-js";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { t } from "@/services/i18n-service";
import { Favorite } from "@/types";
import { URL_CHECK_REGEX } from "@/utils/constants";

export const FavoriteTaskLinkModal = (props: {
  favorite: Favorite;
  open: boolean;
  onClose: () => void;
  onConfirm: (name: string, taskLink: string) => Promise<void>;
}) => {
  const [taskLink, setTaskLink] = createSignal(props.favorite.task_link || "");
  const [hasError, setHasError] = createSignal(false);
  const [inputRef, setInputRef] = createSignal<HTMLInputElement | null>(null);

  createEffect(() => {
    if (props.open && inputRef()) {
      inputRef()!.focus();
    }
  });

  createEffect(() => {
    if (props.open) {
      setTaskLink(props.favorite.task_link || "");
      setHasError(false);
    }
  });

  const handleSave = async () => {
    const isValidUrl = URL_CHECK_REGEX.test(taskLink()) || taskLink() === "";
    if (!isValidUrl) {
      setHasError(true);
      return;
    }
    await props.onConfirm(props.favorite.name, taskLink());
    props.onClose();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") props.onClose();
    if (e.key === "Enter") handleSave();
  };

  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title={t("options.favorites.task_link_title", [props.favorite.display_name])}
      description={t("options.favorites.task_link_desc")}
      footer={
        <>
          <Button id="cancel-task-link" color="error" variant="outline" onClick={props.onClose}>
            {t("common.cancel")}
          </Button>
          <Button id="save-task-link" color="primary" onClick={handleSave}>
            {t("common.save")}
          </Button>
        </>
      }
    >
      <div class="flex flex-col gap-3">
        <Input
          ref={setInputRef}
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
          onKeyDown={handleKeyDown}
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
