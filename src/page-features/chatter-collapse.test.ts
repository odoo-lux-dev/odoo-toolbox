import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { COLLAPSED_CLASS, COLLAPSED_STORAGE_KEY } from "./chatter-aside";
import { handleChatterToggle, restoreChatterCollapsed } from "./chatter-collapse";

const root = document.documentElement;

const renderForm = () => {
  document.body.innerHTML = `<div class="o_form_view"><div class="o_form_sheet_bg"></div><div class="o-mail-Form-chatter o-aside"><div class="o-mail-Chatter"><div class="o-mail-Chatter-topbar"><button>Send message</button></div></div></div></div>`;
  return document.body.querySelector(".o_form_view") as Element;
};

const openButtons = () => document.querySelectorAll<HTMLButtonElement>(".x-odoo-chatter-open");
const closeButtons = () => document.querySelectorAll<HTMLButtonElement>(".x-odoo-chatter-close");
const isCollapsed = () => root.classList.contains(COLLAPSED_CLASS);

beforeEach(() => {
  window.odoo = { info: { server_version_info: [18, 0, 0, "final", 0, ""] } };
  document.body.dataset.sideChatterControls = "true";
});

afterEach(() => {
  window.odoo = undefined;
  document.body.innerHTML = "";
  delete document.body.dataset.sideChatterControls;
  root.classList.remove(COLLAPSED_CLASS);
  localStorage.clear();
});

describe("handleChatterToggle", () => {
  test("adds one open button to the chatter and one close button to its topbar", () => {
    const form = renderForm();
    handleChatterToggle(form);
    handleChatterToggle(form);
    expect(openButtons()).toHaveLength(1);
    expect(openButtons()[0].parentElement?.classList.contains("o-mail-Form-chatter")).toBe(true);
    expect(closeButtons()).toHaveLength(1);
    expect(closeButtons()[0].parentElement?.classList.contains("o-mail-Chatter-topbar")).toBe(true);
  });

  test("adds the close button back to a re-rendered topbar", () => {
    handleChatterToggle(renderForm());
    const topbar = document.querySelector(".o-mail-Chatter-topbar") as Element;
    topbar.replaceWith(topbar.cloneNode(false));
    const newTopbar = document.querySelector(".o-mail-Chatter-topbar") as HTMLElement;
    handleChatterToggle(newTopbar);
    expect(closeButtons()).toHaveLength(1);
    expect(closeButtons()[0].parentElement).toBe(newTopbar);
  });

  test("ignores a topbar outside a form chatter", () => {
    document.body.innerHTML = `<div class="o-mail-Chatter-topbar"></div>`;
    handleChatterToggle(document.body);
    expect(closeButtons()).toHaveLength(0);
  });

  test("closes and opens the chatter, and remembers it", () => {
    handleChatterToggle(renderForm());

    closeButtons()[0].click();
    expect(isCollapsed()).toBe(true);
    expect(localStorage.getItem(COLLAPSED_STORAGE_KEY)).toBe("1");

    openButtons()[0].click();
    expect(isCollapsed()).toBe(false);
    expect(localStorage.getItem(COLLAPSED_STORAGE_KEY)).toBeNull();
  });

  test("does nothing when the setting is off", () => {
    document.body.dataset.sideChatterControls = "false";
    handleChatterToggle(renderForm());
    expect(openButtons()).toHaveLength(0);
    expect(closeButtons()).toHaveLength(0);
  });

  test("reveals the open button of a collapsed chatter when the mouse nears the edge", () => {
    const form = renderForm();
    handleChatterToggle(form);
    const [openButton] = openButtons();
    const isRevealed = () => openButton.classList.contains("x-odoo-chatter-open-near");

    form.dispatchEvent(new MouseEvent("mousemove", { clientX: 0 }));
    expect(isRevealed()).toBe(false);

    closeButtons()[0].click();
    form.dispatchEvent(new MouseEvent("mousemove", { clientX: 10 }));
    expect(isRevealed()).toBe(true);

    form.dispatchEvent(new MouseEvent("mousemove", { clientX: 40 }));
    expect(isRevealed()).toBe(false);

    form.dispatchEvent(new MouseEvent("mousemove", { clientX: 10 }));
    form.dispatchEvent(new MouseEvent("mouseleave"));
    expect(isRevealed()).toBe(false);
  });
});

describe("restoreChatterCollapsed", () => {
  test("collapses the chatter when it was left collapsed", () => {
    localStorage.setItem(COLLAPSED_STORAGE_KEY, "1");
    restoreChatterCollapsed();
    expect(isCollapsed()).toBe(true);
  });

  test("keeps the chatter open when nothing was stored", () => {
    restoreChatterCollapsed();
    expect(isCollapsed()).toBe(false);
  });

  test("collapses the chatter on every load when it is hidden by default", () => {
    document.body.dataset.hideChatterByDefault = "true";
    restoreChatterCollapsed();
    expect(isCollapsed()).toBe(true);
    delete document.body.dataset.hideChatterByDefault;
  });

  test("does nothing when the setting is off", () => {
    document.body.dataset.sideChatterControls = "false";
    document.body.dataset.hideChatterByDefault = "true";
    localStorage.setItem(COLLAPSED_STORAGE_KEY, "1");
    restoreChatterCollapsed();
    expect(isCollapsed()).toBe(false);
    delete document.body.dataset.hideChatterByDefault;
  });
});
