type ActWindowAction = {
  name: string;
  type: "ir.actions.act_window";
  res_model: string;
  res_id?: number;
  views: [false, string][];
  target: "new" | "current";
  domain?: unknown[];
};

const MULTI_RECORD_VIEWS: [false, string][] = [
  [false, "list"],
  [false, "kanban"],
  [false, "form"],
];

export const buildActWindowAction = (opts: {
  model: string;
  recordIds?: number | number[];
  domain?: unknown[];
  asPopup?: boolean;
  title?: string;
}): ActWindowAction => {
  const { model, domain, asPopup, title } = opts;
  const recordIds = typeof opts.recordIds === "number" ? [opts.recordIds] : (opts.recordIds ?? []);
  const action: ActWindowAction = {
    name: title ?? "Odoo Toolbox",
    type: "ir.actions.act_window",
    res_model: model,
    target: asPopup ? "new" : "current",
    views: MULTI_RECORD_VIEWS,
  };

  if (recordIds.length === 1) {
    action.res_id = recordIds[0];
    action.views = [[false, "form"]];
  } else if (recordIds.length > 1) {
    action.domain = domain || [["id", "in", recordIds]];
  } else if (domain) {
    action.domain = domain;
  }
  return action;
};
