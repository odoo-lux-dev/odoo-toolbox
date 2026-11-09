import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { CUSTOM_BACKGROUND_CLASS, handleHideHomeMenuBackground } from "./home-menu-background";

const flushMutations = () => new Promise((resolve) => setTimeout(resolve, 0));

let observer: MutationObserver | null = null;

beforeEach(() => {
  window.odoo = {} as typeof window.odoo;
});

afterEach(() => {
  observer?.disconnect();
  observer = null;
  document.body.className = "";
  delete document.body.dataset.hideHomeMenuBackground;
  delete (window as { odoo?: unknown }).odoo;
});

describe("handleHideHomeMenuBackground", () => {
  test("does nothing when the setting is disabled", () => {
    document.body.dataset.hideHomeMenuBackground = "false";
    document.body.classList.add(CUSTOM_BACKGROUND_CLASS);

    observer = handleHideHomeMenuBackground();
    expect(observer).toBeNull();
    expect(document.body.classList.contains(CUSTOM_BACKGROUND_CLASS)).toBe(true);
  });

  test("does nothing outside of Odoo", () => {
    delete (window as { odoo?: unknown }).odoo;
    document.body.dataset.hideHomeMenuBackground = "true";
    document.body.classList.add(CUSTOM_BACKGROUND_CLASS);

    observer = handleHideHomeMenuBackground();
    expect(observer).toBeNull();
    expect(document.body.classList.contains(CUSTOM_BACKGROUND_CLASS)).toBe(true);
  });

  test("removes the custom background class already on the body", () => {
    document.body.dataset.hideHomeMenuBackground = "true";
    document.body.classList.add("o_home_menu_background", CUSTOM_BACKGROUND_CLASS);

    observer = handleHideHomeMenuBackground();
    expect(observer).not.toBeNull();
    expect(document.body.classList.contains(CUSTOM_BACKGROUND_CLASS)).toBe(false);
    expect(document.body.classList.contains("o_home_menu_background")).toBe(true);
  });

  test("removes the custom background class when the home menu is mounted later", async () => {
    document.body.dataset.hideHomeMenuBackground = "true";
    observer = handleHideHomeMenuBackground();

    document.body.classList.add("o_home_menu_background");
    document.body.classList.toggle(CUSTOM_BACKGROUND_CLASS, true);
    await flushMutations();

    expect(document.body.classList.contains(CUSTOM_BACKGROUND_CLASS)).toBe(false);
    expect(document.body.classList.contains("o_home_menu_background")).toBe(true);
  });
});
