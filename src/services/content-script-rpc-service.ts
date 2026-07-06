import { buildActWindowAction, openViewViaOwlRuntime } from "@/services/odoo-action";
import { createOdooRpc } from "@/services/odoo-rpc-service";
import type { FieldDetails, ModelAccessRight, ModelRecordRule, ViewRecord } from "@/types";

const pageContextRpc = createOdooRpc({
  getOrigin: async () => "",
});

const executeOdooRpc = async <T = unknown>(
  model: string,
  method: string,
  args: unknown[] = [],
  kwargs: Record<string, unknown> = {},
): Promise<T> => {
  return pageContextRpc.executeRpc({
    model,
    method,
    args,
    kwargs,
  }) as Promise<T>;
};

async function searchReadRecords(
  model: string,
  domain: unknown[] = [],
  limit?: number,
): Promise<number[]> {
  const result = await executeOdooRpc<Array<{ id: number }>>(model, "search_read", [domain], {
    limit,
    fields: ["id"],
  });
  return result.map((record) => record.id);
}

async function readRecord(model: string, id: number): Promise<Record<string, unknown>[]> {
  const result = await executeOdooRpc<Record<string, unknown>[]>(model, "read", [[id]]);
  return result;
}

export async function getModelFieldIds(model: string): Promise<number[]> {
  return searchReadRecords("ir.model.fields", [["model", "=", model]]);
}

export async function getModelRuleIds(model: string): Promise<number[]> {
  return searchReadRecords("ir.rule", [["model_id.model", "=", model]]);
}

export async function getModelAccessIds(model: string): Promise<number[]> {
  return searchReadRecords("ir.model.access", [["model_id.model", "=", model]]);
}

export async function getServerActionsIds(model: string): Promise<number[]> {
  return searchReadRecords("ir.actions.server", [["model_id.model", "=", model]]);
}

export async function getRecordData(model: string, id: number): Promise<Record<string, unknown>[]> {
  return readRecord(model, id);
}

export async function openViewWithIds(
  model: string,
  recordIds?: number[],
  title?: string,
): Promise<void> {
  const action = buildActWindowAction({
    model,
    recordIds,
    asPopup: true,
    title,
  });
  await openViewViaOwlRuntime(action, {});
}

export async function getModelAccessRights(model: string): Promise<ModelAccessRight[]> {
  return executeOdooRpc<ModelAccessRight[]>("ir.model.access", "search_read", [
    [["model_id.model", "=", model]],
    ["name", "group_id", "perm_read", "perm_write", "perm_create", "perm_unlink"],
  ]);
}

export async function getModelRecordRules(model: string): Promise<ModelRecordRule[]> {
  return executeOdooRpc<ModelRecordRule[]>("ir.rule", "search_read", [
    [["model_id.model", "=", model]],
    ["name", "groups", "domain_force", "perm_read", "perm_write", "perm_create", "perm_unlink"],
  ]);
}

export async function getGroupNames(groupIds: number[]): Promise<Record<number, string>> {
  if (groupIds.length === 0) return {};
  const result = await executeOdooRpc<Array<{ id: number; display_name: string }>>(
    "res.groups",
    "search_read",
    [[["id", "in", groupIds]], ["display_name"]],
  );
  return Object.fromEntries(result.map((g) => [g.id, g.display_name]));
}

export async function getFieldDetails(
  model: string,
  fieldName: string,
): Promise<FieldDetails | null> {
  const result = await executeOdooRpc<FieldDetails[]>(
    "ir.model.fields",
    "search_read",
    [
      [
        ["model", "=", model],
        ["name", "=", fieldName],
      ],
      [
        "id",
        "name",
        "field_description",
        "ttype",
        "relation",
        "relation_field",
        "required",
        "readonly",
        "store",
        "compute",
        "depends",
        "copied",
        "help",
        "size",
        "translate",
        "index",
        "domain",
        "groups",
        "on_delete",
        "related",
        "modules",
      ],
    ],
    { limit: 1 },
  );
  return result[0] ?? null;
}

export async function getBaseView(model: string, viewType: string): Promise<ViewRecord | null> {
  const result = await executeOdooRpc<ViewRecord[]>(
    "ir.ui.view",
    "search_read",
    [
      [
        ["model", "=", model],
        ["type", "=", viewType],
        ["inherit_id", "=", false],
      ],
      ["name", "xml_id", "key", "priority", "arch_db"],
    ],
    { limit: 1, order: "priority" },
  );
  return result[0] ?? null;
}

export async function getInheritedViews(parentViewId: number): Promise<ViewRecord[]> {
  return executeOdooRpc<ViewRecord[]>(
    "ir.ui.view",
    "search_read",
    [[["inherit_id", "=", parentViewId]], ["name", "xml_id", "key", "priority", "arch_db"]],
    { order: "priority" },
  );
}
