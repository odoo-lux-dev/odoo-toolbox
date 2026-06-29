import { makeEventListener } from "@solid-primitives/event-listener";
import { For, Show, createEffect, createSignal, splitProps } from "solid-js";

interface ContextMenuItem {
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

export const ContextMenu = (props: ContextMenuProps) => {
  const [local] = splitProps(props, ["visible", "position", "items", "onClose"]);
  const [menuEl, setMenuEl] = createSignal<HTMLDivElement | null>(null);

  createEffect(() => {
    if (!local.visible) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuEl() && !menuEl()!.contains(event.target as Node)) {
        local.onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        local.onClose();
      }
    };

    makeEventListener(document, "mousedown", handleClickOutside);
    makeEventListener(document, "keydown", handleEscape);

    setTimeout(() => {
      const el = menuEl();
      if (el) {
        const rect = el.getBoundingClientRect();
        let adjustedX = local.position.x;
        let adjustedY = local.position.y;

        if (rect.right > window.innerWidth) {
          adjustedX = window.innerWidth - rect.width - 10;
        }

        if (rect.bottom > window.innerHeight) {
          adjustedY = window.innerHeight - rect.height - 10;
        }

        el.style.left = `${adjustedX}px`;
        el.style.top = `${adjustedY}px`;
      }
    }, 0);
  });

  return (
    <Show when={local.visible}>
      <div
        ref={setMenuEl}
        class="min-w-45 overflow-hidden rounded-md border border-base-300 bg-base-200 shadow-lg"
        style={{
          position: "fixed",
          left: `${local.position.x}px`,
          top: `${local.position.y}px`,
          "z-index": 1000,
        }}
      >
        <For each={local.items}>
          {(item, index) => (
            <div>
              <div
                class={`px-3 py-2 text-xs ${
                  item.isTitle
                    ? "cursor-default font-semibold text-base-content/70"
                    : "cursor-pointer text-base-content hover:bg-primary hover:text-primary-content"
                }`}
                onClick={
                  item.isTitle
                    ? undefined
                    : () => {
                        item.action();
                        local.onClose();
                      }
                }
              >
                {item.label}
              </div>
              <Show when={item.separator}>
                <div class="h-px bg-base-300" />
              </Show>
            </div>
          )}
        </For>
      </div>
    </Show>
  );
};
