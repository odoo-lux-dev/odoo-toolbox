import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { CUSTOM_BACKGROUND_CLASS, hideCustomHomeMenuBackground } from "./home-menu-background";

let observer: MutationObserver | undefined;

const hasCustomClass = () => document.body.classList.contains(CUSTOM_BACKGROUND_CLASS);

const flushMutations = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  window.odoo = { info: { server_version_info: [18, 0, 0, "final", 0, ""] } };
  document.body.className = CUSTOM_BACKGROUND_CLASS;
  document.body.dataset.hideHomeMenuBackground = "true";
});

afterEach(() => {
  observer?.disconnect();
  observer = undefined;
  document.body.className = "";
  delete document.body.dataset.hideHomeMenuBackground;
  window.odoo = undefined;
});

describe("hideCustomHomeMenuBackground", () => {
  test("removes the custom background class when the setting is on", () => {
    observer = hideCustomHomeMenuBackground();
    expect(observer).toBeDefined();
    expect(hasCustomClass()).toBe(false);
  });

  test("removes the class again when Odoo adds it back", async () => {
    observer = hideCustomHomeMenuBackground();
    document.body.classList.add("o_home_menu_background", CUSTOM_BACKGROUND_CLASS);
    await flushMutations();
    expect(hasCustomClass()).toBe(false);
    expect(document.body.classList.contains("o_home_menu_background")).toBe(true);
  });

  test("does nothing when the setting is off", () => {
    document.body.dataset.hideHomeMenuBackground = "false";
    observer = hideCustomHomeMenuBackground();
    expect(observer).toBeUndefined();
    expect(hasCustomClass()).toBe(true);
  });

  test("does nothing outside Odoo", () => {
    window.odoo = undefined;
    observer = hideCustomHomeMenuBackground();
    expect(observer).toBeUndefined();
    expect(hasCustomClass()).toBe(true);
  });
});
