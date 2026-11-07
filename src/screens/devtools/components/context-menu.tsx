import { For, Show } from "solid-js";

import { Popover } from "@/components/ui/popover";

export interface ContextMenuItem {
  label: string;
  action: () => void;
  separator?: boolean;
  isTitle?: boolean;
}

interface ContextMenuProps {
  visible: boolean;
  position: { x: number; y: number };
  items: ContextMenuItem[];
  onClose: () => void;
}

export const ContextMenu = (props: ContextMenuProps) => (
  <Popover
    open={props.visible}
    anchor={props.position}
    onClose={props.onClose}
    class="min-w-45 overflow-hidden p-1"
  >
    <For each={props.items}>
      {(item) => (
        <div>
          <div
            class={`px-2.5 py-1.5 ${
              item.isTitle
                ? "cursor-default font-mono text-caption font-medium tracking-wider text-ink-3 uppercase"
                : "cursor-pointer rounded-sm text-ui text-ink-2 hover:bg-primary-soft hover:text-primary"
            }`}
            onClick={
              item.isTitle
                ? undefined
                : () => {
                    item.action();
                    props.onClose();
                  }
            }
          >
            {item.label}
          </div>
          <Show when={item.separator}>
            <div class="my-1 h-px bg-line-soft" />
          </Show>
        </div>
      )}
    </For>
  </Popover>
);
