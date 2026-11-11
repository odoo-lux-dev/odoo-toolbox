import { expect, test } from "bun:test";

import { createRoot, createSignal } from "solid-js";

import { createGridNavigation } from "@/screens/devtools/components/grid-navigation";

const setup = () =>
  createRoot((dispose) => {
    const [rows] = createSignal<readonly unknown[]>([1, 2, 3, 4, 5]);
    const revealed: number[] = [];
    const navigation = createGridNavigation({
      rows,
      pageSize: () => 2,
      reveal: (index) => revealed.push(index),
      describeRow: (index) => `row ${index}`,
    });
    const grid = document.createElement("div");
    const press = (key: string) => {
      const event = new KeyboardEvent("keydown", { key });
      Object.defineProperty(event, "target", { value: grid });
      Object.defineProperty(event, "currentTarget", { value: grid });
      navigation.gridHandlers.onKeyDown(event);
    };
    return { navigation, press, revealed, dispose };
  });

test("the keys move the active row within the rows and reveal it", () => {
  const { navigation, press, revealed, dispose } = setup();
  navigation.gridHandlers.onFocus();
  expect(navigation.activeRow()).toBe(0);
  press("PageDown");
  press("ArrowDown");
  expect(navigation.activeRow()).toBe(3);
  press("End");
  press("ArrowDown");
  expect(navigation.activeRow()).toBe(4);
  press("Home");
  press("ArrowUp");
  expect(navigation.activeRow()).toBe(0);
  expect(revealed).toEqual([2, 3, 4, 4, 0, 0]);
  dispose();
});

test("Enter and a click toggle the selection of a row", () => {
  const { navigation, press, dispose } = setup();
  navigation.gridHandlers.onFocus();
  press("ArrowDown");
  press("Enter");
  expect(navigation.selectedRow()).toBe(1);
  press(" ");
  expect(navigation.selectedRow()).toBeNull();
  navigation.clickRow(2);
  expect(navigation.selectedRow()).toBe(2);
  expect(navigation.activeRow()).toBe(2);
  dispose();
});
