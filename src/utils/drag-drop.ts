import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";
import {
  attachClosestEdge,
  extractClosestEdge,
  type Edge,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import {
  draggable,
  dropTargetForElements,
  monitorForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { createSignal, onCleanup, onMount } from "solid-js";

const TRANSPARENT_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

export interface DropTargetState {
  index: number;
  edge: "top" | "bottom";
}

export function attachAutoScroll(element: HTMLElement): () => void {
  return autoScrollForElements({
    element,
    getConfiguration: () => ({ maxScrollSpeed: "standard" }),
  });
}

export function createSortableList(opts: {
  type: string;
  onReorder: (fromIndex: number, toIndex: number, position: "before" | "after") => void;
}) {
  const [dropTarget, setDropTarget] = createSignal<DropTargetState | null>(null);

  onMount(() => {
    const cleanup = monitorForElements({
      onDrop: () => setDropTarget(null),
    });
    onCleanup(cleanup);
  });

  function useItem(getIndex: () => number) {
    const [isDragging, setIsDragging] = createSignal(false);

    function attach(element: HTMLElement, dragHandle?: HTMLElement): () => void {
      const dCleanup = draggable({
        element,
        dragHandle,
        getInitialData: () => ({ index: getIndex(), type: opts.type }),
        onGenerateDragPreview: ({ nativeSetDragImage }) => {
          if (!nativeSetDragImage) return;
          const img = new Image();
          img.src = TRANSPARENT_PIXEL;
          nativeSetDragImage(img, 0, 0);
        },
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
      });

      const dtCleanup = dropTargetForElements({
        element,
        canDrop: ({ source }) => source.data.type === opts.type && source.element !== element,
        getData: ({ input, element }) =>
          attachClosestEdge(
            { index: getIndex() },
            { input, element, allowedEdges: ["top", "bottom"] as Edge[] },
          ),
        getIsSticky: () => true,
        onDragEnter: ({ self }) => {
          setDropTarget({
            index: self.data.index as number,
            edge: extractClosestEdge(self.data) as "top" | "bottom",
          });
        },
        onDrag: ({ self }) => {
          const next = {
            index: self.data.index as number,
            edge: extractClosestEdge(self.data) as "top" | "bottom",
          };
          setDropTarget((prev) =>
            prev?.index === next.index && prev?.edge === next.edge ? prev : next,
          );
        },
        onDrop: ({ source, self }) => {
          const fromIdx = source.data.index as number;
          const toIdx = self.data.index as number;
          const edge = extractClosestEdge(self.data);
          opts.onReorder(fromIdx, toIdx, edge === "top" ? "before" : "after");
          setDropTarget(null);
        },
      });

      return () => {
        dCleanup();
        dtCleanup();
      };
    }

    return { isDragging, attach };
  }

  return { useItem, dropTarget };
}

export function reorderArray<T>(
  items: T[],
  from: number,
  to: number,
  position: "before" | "after",
): T[] {
  if (from === to) return items;
  const result = [...items];
  const [moved] = result.splice(from, 1);
  const adjustedTo = from < to ? to - 1 : to;
  const insertAt = position === "before" ? adjustedTo : adjustedTo + 1;
  result.splice(insertAt, 0, moved);
  return result;
}
