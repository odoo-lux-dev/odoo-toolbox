import { describe, expect, test } from "bun:test";

import { buildActWindowAction } from "@/services/odoo-action";

describe("buildActWindowAction", () => {
  test("should build action for single record ID", () => {
    const action = buildActWindowAction({ model: "res.partner", recordIds: [42] });
    expect(action.res_model).toBe("res.partner");
    expect(action.type).toBe("ir.actions.act_window");
    expect(action.res_id).toBe(42);
    expect(action.views).toEqual([[false, "form"]]);
    expect(action.target).toBe("current");
  });

  test("should build action for multiple record IDs", () => {
    const action = buildActWindowAction({ model: "res.partner", recordIds: [1, 2, 3] });
    expect(action.res_id).toBeUndefined();
    expect(action.views).toEqual([
      [false, "list"],
      [false, "kanban"],
      [false, "form"],
    ]);
    expect(action.domain).toEqual([["id", "in", [1, 2, 3]]]);
  });

  test("should use custom domain when provided with multiple IDs", () => {
    const customDomain = [["name", "=", "test"]];
    const action = buildActWindowAction({
      model: "res.partner",
      recordIds: [1, 2],
      domain: customDomain,
    });
    expect(action.domain).toBe(customDomain);
  });

  test("should build action with no record IDs (list view)", () => {
    const action = buildActWindowAction({ model: "res.partner" });
    expect(action.res_id).toBeUndefined();
    expect(action.views).toEqual([
      [false, "list"],
      [false, "kanban"],
      [false, "form"],
    ]);
  });

  test("should build action with empty record IDs array", () => {
    const action = buildActWindowAction({ model: "res.partner", recordIds: [] });
    expect(action.res_id).toBeUndefined();
    expect(action.views).toEqual([
      [false, "list"],
      [false, "kanban"],
      [false, "form"],
    ]);
  });

  test("should set target to 'new' for popup", () => {
    const action = buildActWindowAction({ model: "res.partner", recordIds: [1], asPopup: true });
    expect(action.target).toBe("new");
  });

  test("should set target to 'current' by default", () => {
    const action = buildActWindowAction({ model: "res.partner", recordIds: [1] });
    expect(action.target).toBe("current");
  });

  test("should use custom title when provided", () => {
    const action = buildActWindowAction({ model: "res.partner", title: "Custom Title" });
    expect(action.name).toBe("Custom Title");
  });

  test("should use default title when not provided", () => {
    const action = buildActWindowAction({ model: "res.partner" });
    expect(action.name).toBe("Odoo Toolbox");
  });
});
