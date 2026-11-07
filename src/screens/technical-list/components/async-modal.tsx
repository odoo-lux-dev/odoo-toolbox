import { Match, Switch, type JSX, type Resource } from "solid-js";

import { Alert } from "@/components/ui/alert";
import { Modal, type ModalSize } from "@/components/ui/modal";
import { errorMessage } from "@/utils/error-message";

interface AsyncModalProps<T> {
  open: boolean;
  onClose: () => void;
  title: string;
  size: ModalSize;
  boxClass: string;
  loadingLabel: string;
  data: Resource<T>;
  children: (data: T) => JSX.Element;
}

/** Modal showing data fetched when it opens, with its loading and error states. */
export const AsyncModal = <T,>(props: AsyncModalProps<T>) => (
  <Modal
    open={props.open}
    onClose={props.onClose}
    title={props.title}
    size={props.size}
    boxClass={props.boxClass}
  >
    <div class="mt-3 max-h-[70vh] overflow-auto">
      <Switch>
        <Match when={props.data.loading}>
          <Alert color="info" variant="outline" class="items-start">
            <span class="text-sm">{props.loadingLabel}</span>
          </Alert>
        </Match>
        <Match when={props.data.error as unknown}>
          {(error) => (
            <Alert color="error" variant="outline" class="items-start">
              <span class="text-sm">{errorMessage(error(), String(error()))}</span>
            </Alert>
          )}
        </Match>
        <Match when={props.data()}>{(data) => props.children(data())}</Match>
      </Switch>
    </div>
  </Modal>
);
