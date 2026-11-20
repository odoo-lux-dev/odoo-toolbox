import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import {
  clampChatterWidth,
  handleChatterResizer,
  resolveDraggedWidth,
  RESIZED_CLASS,
  restoreChatterWidth,
  WIDTH_PROPERTY,
  WIDTH_STORAGE_KEY,
} from "./chatter-resize";

const root = document.documentElement;

const renderForm = (chatterClass: string) => {
  document.body.innerHTML = `<div class="o_form_renderer"><div class="o_form_sheet_bg"></div><div class="${chatterClass} o-aside"></div></div>`;
  return document.body.querySelector(".o_form_renderer") as Element;
};

const resizers = () => document.querySelectorAll(".x-odoo-chatter-resizer");

beforeEach(() => {
  window.odoo = { info: { server_version_info: [18, 0, 0, "final", 0, ""] } };
  document.body.dataset.sideChatterControls = "true";
});

afterEach(() => {
  window.odoo = undefined;
  document.body.innerHTML = "";
  delete document.body.dataset.sideChatterControls;
  root.classList.remove(RESIZED_CLASS);
  root.style.removeProperty(WIDTH_PROPERTY);
  localStorage.clear();
});

describe("clampChatterWidth", () => {
  test("keeps the width between the chatter and sheet minimums", () => {
    expect(clampChatterWidth(700, 2000)).toBe(700);
    expect(clampChatterWidth(100, 2000)).toBe(200);
    expect(clampChatterWidth(1800, 2000)).toBe(1520);
  });

  test("prefers the chatter minimum on a narrow form", () => {
    expect(clampChatterWidth(500, 600)).toBe(200);
  });
});

describe("resolveDraggedWidth", () => {
  test("collapses the chatter dragged below the threshold", () => {
    expect(resolveDraggedWidth(199, 2000)).toBeNull();
  });

  test("follows the drag above the threshold", () => {
    expect(resolveDraggedWidth(200, 2000)).toBe(200);
    expect(resolveDraggedWidth(700, 2000)).toBe(700);
  });
});

describe("handleChatterResizer", () => {
  test("adds one handle to the 17.0+ chatter, however often it runs", () => {
    const form = renderForm("o-mail-ChatterContainer o-mail-Form-chatter");
    handleChatterResizer(form);
    handleChatterResizer(form);
    expect(resizers()).toHaveLength(1);
    expect(resizers()[0].parentElement?.classList.contains("o-mail-Form-chatter")).toBe(true);
  });

  test("adds a handle to the 16.0 chatter when it is the added node", () => {
    renderForm("o_FormRenderer_chatterContainer");
    handleChatterResizer(document.querySelector(".o_FormRenderer_chatterContainer") as Element);
    expect(resizers()).toHaveLength(1);
  });

  test("does nothing when the setting is off", () => {
    document.body.dataset.sideChatterControls = "false";
    handleChatterResizer(renderForm("o-mail-Form-chatter"));
    expect(resizers()).toHaveLength(0);
  });

  test("resets the width on double-click", () => {
    localStorage.setItem(WIDTH_STORAGE_KEY, "700");
    restoreChatterWidth();
    handleChatterResizer(renderForm("o-mail-Form-chatter"));
    resizers()[0].dispatchEvent(new MouseEvent("dblclick"));
    expect(root.classList.contains(RESIZED_CLASS)).toBe(false);
    expect(root.style.getPropertyValue(WIDTH_PROPERTY)).toBe("");
    expect(localStorage.getItem(WIDTH_STORAGE_KEY)).toBeNull();
  });
});

describe("restoreChatterWidth", () => {
  test("applies the stored width", () => {
    localStorage.setItem(WIDTH_STORAGE_KEY, "700");
    restoreChatterWidth();
    expect(root.classList.contains(RESIZED_CLASS)).toBe(true);
    expect(root.style.getPropertyValue(WIDTH_PROPERTY)).toBe("700px");
  });

  test("keeps Odoo's width without a stored one", () => {
    restoreChatterWidth();
    expect(root.classList.contains(RESIZED_CLASS)).toBe(false);
  });

  test("does nothing outside Odoo", () => {
    window.odoo = undefined;
    localStorage.setItem(WIDTH_STORAGE_KEY, "700");
    restoreChatterWidth();
    expect(root.classList.contains(RESIZED_CLASS)).toBe(false);
  });
});
