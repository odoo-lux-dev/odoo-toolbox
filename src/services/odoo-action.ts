import { resolveDoActionFunction } from "@/services/owl-runtime";

export interface ActWindowAction {
  name?: string;
  type: string;
  res_model: string;
  res_id?: number;
  views?: unknown[];
  target?: string;
  domain?: unknown[];
  context?: Record<string, unknown>;
}

export const buildActWindowAction = (opts: {
  model: string;
  recordIds?: number[];
  domain?: unknown[];
  asPopup?: boolean;
  title?: string;
}): ActWindowAction => {
  const { model, recordIds, domain, asPopup, title } = opts;
  const action: ActWindowAction = {
    name: title ?? "Odoo Toolbox",
    type: "ir.actions.act_window",
    res_model: model,
    target: asPopup ? "new" : "current",
  };

  if (Array.isArray(recordIds) && recordIds.length > 0) {
    if (recordIds.length === 1) {
      action.res_id = recordIds[0];
      action.views = [[false, "form"]];
    } else {
      action.views = [
        [false, "list"],
        [false, "kanban"],
        [false, "form"],
      ];
      action.domain = domain || [["id", "in", recordIds]];
    }
  } else if (typeof recordIds === "number") {
    action.res_id = recordIds;
    action.views = [[false, "form"]];
  } else {
    action.views = [
      [false, "list"],
      [false, "kanban"],
      [false, "form"],
    ];
  }

  return action;
};

export const openViewViaOwlRuntime = (
  action: ActWindowAction,
  options: Record<string, unknown> = {},
) => {
  const doActionFn = resolveDoActionFunction(window.odoo as never);
  if (!doActionFn) {
    throw new Error("Action service not available");
  }
  return doActionFn(action, options);
};
