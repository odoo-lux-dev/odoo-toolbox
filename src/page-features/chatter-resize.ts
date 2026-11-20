import {
  findChatterContainers,
  isSideChatterControlsEnabled,
  readStoredValue,
  setChatterCollapsed,
  showChatterCollapsed,
  storeValue,
} from "@/page-features/chatter-aside";
import { t } from "@/utils/i18n-page";

const RESIZER_CLASS = "x-odoo-chatter-resizer";
const RESIZING_CLASS = "x-odoo-chatter-resizing";
export const RESIZED_CLASS = "x-odoo-chatter-resized";
export const WIDTH_PROPERTY = "--x-odoo-chatter-width";
export const WIDTH_STORAGE_KEY = "x-odoo-toolbox-chatter-width";
const MIN_SHEET_WIDTH = 480;
const MIN_CHATTER_WIDTH = 200;

export const clampChatterWidth = (width: number, availableWidth: number): number =>
  Math.round(Math.max(MIN_CHATTER_WIDTH, Math.min(width, availableWidth - MIN_SHEET_WIDTH)));

export const resolveDraggedWidth = (width: number, availableWidth: number): number | null =>
  width < MIN_CHATTER_WIDTH ? null : clampChatterWidth(width, availableWidth);

const setChatterWidth = (width: number | null): void => {
  const root = document.documentElement;
  if (width === null) {
    root.classList.remove(RESIZED_CLASS);
    root.style.removeProperty(WIDTH_PROPERTY);
    return;
  }
  root.style.setProperty(WIDTH_PROPERTY, `${width}px`);
  root.classList.add(RESIZED_CLASS);
};

const readStoredWidth = (): number | null => {
  const width = Number(readStoredValue(WIDTH_STORAGE_KEY));
  return width > 0 ? width : null;
};

const storeWidth = (width: number | null): void =>
  storeValue(WIDTH_STORAGE_KEY, width === null ? null : String(width));

export const restoreChatterWidth = (): void => {
  if (!isSideChatterControlsEnabled()) return;
  const width = readStoredWidth();
  if (width !== null) setChatterWidth(width);
};

const startResize = (event: PointerEvent): void => {
  const handle = event.currentTarget as HTMLElement;
  const chatter = handle.parentElement;
  const form = chatter?.parentElement;
  if (event.button !== 0 || !chatter || !form) return;
  event.preventDefault();

  const startX = event.clientX;
  const startWidth = chatter.getBoundingClientRect().width;
  const availableWidth = form.getBoundingClientRect().width;
  // The chatter is on the left in right-to-left languages.
  const direction = getComputedStyle(form).direction === "rtl" ? -1 : 1;
  let width: number | null = startWidth;

  const resize = (moveEvent: PointerEvent) => {
    width = resolveDraggedWidth(
      startWidth + direction * (startX - moveEvent.clientX),
      availableWidth,
    );
    showChatterCollapsed(width === null);
    if (width !== null) setChatterWidth(width);
  };
  document.documentElement.classList.add(RESIZING_CLASS);
  handle.setPointerCapture(event.pointerId);
  handle.addEventListener("pointermove", resize);
  handle.addEventListener(
    "lostpointercapture",
    () => {
      handle.removeEventListener("pointermove", resize);
      document.documentElement.classList.remove(RESIZING_CLASS);
      if (width === null) {
        setChatterWidth(readStoredWidth());
        setChatterCollapsed(true);
      } else {
        storeWidth(width);
      }
    },
    { once: true },
  );
};

const resetWidth = (): void => {
  setChatterWidth(null);
  storeWidth(null);
};

const addResizer = (chatter: Element): void => {
  if (chatter.querySelector(`:scope > .${RESIZER_CLASS}`)) return;
  const handle = document.createElement("div");
  handle.className = RESIZER_CLASS;
  handle.title = t("page_features.chatter_resize.handle_title");
  handle.addEventListener("pointerdown", startResize);
  handle.addEventListener("dblclick", resetWidth);
  chatter.appendChild(handle);
};

export const handleChatterResizer = (element: Element): void => {
  if (!isSideChatterControlsEnabled()) return;
  for (const chatter of findChatterContainers(element)) addResizer(chatter);
};
