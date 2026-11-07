import { beforeEach, describe, expect, test } from "bun:test";

import {
  findPickTarget,
  findTargetElements,
  readPickedElement,
  readWebsiteInfo,
  scanElements,
} from "./view-scanner";

const tooltip = (info: object) => `data-tooltip-info='${JSON.stringify(info)}'`;

beforeEach(() => {
  document.body.innerHTML = "";
  document.documentElement.removeAttribute("data-website-id");
});

describe("scanElements", () => {
  test("lists each field once, sorted, with the debug metadata of its tooltip", () => {
    document.body.innerHTML = `
      <div class="o_field_widget o_field_char" name="name"><input value="Azure"></div>
      <div class="o_field_widget o_field_many2one" name="partner_id"><span>Deco</span></div>
      <div class="o_field_widget o_field_char" name="name"><input value="dup"></div>
      <span ${tooltip({ field: { name: "partner_id", label: "Customer", type: "many2one" }, resModel: "sale.order" })}></span>
      <span data-tooltip-info="not json"></span>`;

    const { technicalFields } = scanElements();

    expect(technicalFields.map((field) => field.name)).toEqual(["name", "partner_id"]);
    expect(technicalFields[0]).toMatchObject({ type: "char", value: "Azure" });
    expect(technicalFields[1]).toMatchObject({ type: "m2o", label: "Customer" });
    expect(technicalFields[1]!.debugInfo?.resModel).toBe("sale.order");
  });

  test("reads the type of list cells from their column class", () => {
    document.body.innerHTML = `<table><tr><td class="o_data_cell o_field_cell o_list_many2many" name="tag_ids">a</td></tr></table>`;
    expect(scanElements().technicalFields[0]!.type).toBe("m2m");
  });

  test("can be required: debug true, any condition, or the class alone", () => {
    document.body.innerHTML = `
      <div class="o_field_widget" name="always"></div>
      <div class="o_field_widget o_required_modifier" name="conditional_now"></div>
      <div class="o_field_widget" name="conditional_later"></div>
      <div class="o_field_widget o_required_modifier" name="css_only"></div>
      <div class="o_field_widget" name="never"></div>
      <span ${tooltip({ field: { name: "always", type: "char", required: "True" } })}></span>
      <span ${tooltip({ field: { name: "conditional_now", type: "char", required: "not parent_id" } })}></span>
      <span ${tooltip({ field: { name: "conditional_later", type: "char", required: "not parent_id" } })}></span>
      <span ${tooltip({ field: { name: "never", type: "char", required: false } })}></span>`;

    const state = Object.fromEntries(
      scanElements().technicalFields.map((f) => [f.name, f.canBeRequired]),
    );

    expect(state).toEqual({
      always: true,
      conditional_now: true,
      conditional_later: true,
      css_only: true,
      never: false,
    });
  });

  test("identifies a button by its name before its id, for the list and the highlight", () => {
    document.body.innerHTML = `
      <button type="action" name="42" id="act_id"><span>Open</span></button>
      <button type="object" name="action_confirm"><span>Confirm</span></button>
      <button type="button" name="ignored"></button>`;

    const { technicalButtons } = scanElements();

    expect(technicalButtons.map((b) => [b.type, b.name, b.label])).toEqual([
      ["action", "42", "Open"],
      ["object", "action_confirm", "Confirm"],
    ]);
    expect(findTargetElements({ kind: "button", name: "42", type: "action" })).toHaveLength(1);
  });
});

describe("findPickTarget", () => {
  test("picks the list cell around the clicked node", () => {
    document.body.innerHTML = `<table><tr><td class="o_field_cell" name="amount"><span><b id="start">1</b></span></td></tr></table>`;
    expect(findPickTarget(document.getElementById("start")!)?.getAttribute("name")).toBe("amount");
  });

  test("does not pick a widget from a node nested too deep inside it", () => {
    document.body.innerHTML = `
      <div class="o_field_widget" name="lines"><div><div><div><div><div><div>
        <span id="deep">x</span>
      </div></div></div></div></div></div></div>
      <div class="o_field_widget" name="note"><span id="shallow">x</span></div>`;

    expect(findPickTarget(document.getElementById("deep")!)).toBeNull();
    expect(findPickTarget(document.getElementById("shallow")!)?.getAttribute("name")).toBe("note");
  });

  test("picks Odoo buttons only", () => {
    document.body.innerHTML = `
      <button type="object" name="action_done"><i id="icon"></i></button>
      <button type="button"><i id="plain"></i></button>`;

    const picked = findPickTarget(document.getElementById("icon")!)!;
    expect(readPickedElement(picked)).toMatchObject({ button: { name: "action_done" } });
    expect(findPickTarget(document.getElementById("plain")!)).toBeNull();
  });
});

describe("findTargetElements", () => {
  test("prefers list cells over the widgets rendered inside them", () => {
    document.body.innerHTML = `
      <table><tr><td class="o_field_cell" name="state"><div class="o_field_widget" name="state"></div></td></tr></table>
      <div class="o_field_widget" name="state"></div>`;

    const elements = findTargetElements({ kind: "field", name: "state" });
    expect(elements.map((el) => el.tagName)).toEqual(["TD"]);
  });

  test("finds buttons whose name is not a CSS identifier", () => {
    document.body.innerHTML = `<button type="action" name='%(x"y)d'></button>`;
    expect(findTargetElements({ kind: "button", name: '%(x"y)d', type: "action" })).toHaveLength(1);
  });
});

describe("readWebsiteInfo", () => {
  test("reads the website attributes of the page root", () => {
    document.documentElement.setAttribute("data-website-id", "1");
    document.documentElement.setAttribute("data-logged", "true");
    expect(readWebsiteInfo()).toMatchObject({ websiteId: "1", isLogged: true });
  });

  test("returns null outside a website page", () => {
    expect(readWebsiteInfo()).toBeNull();
  });
});
