import { createOdooRpc } from "@/services/create-odoo-rpc";
import { buildActWindowAction } from "@/services/odoo-action";
import { executeOdooAction } from "@/services/owl-runtime";

type Many2one = [number, string] | false;
export type Domain = unknown[];

export interface ViewRecord {
  id: number;
  name: string;
  xml_id: string | false;
  key: string | false;
  priority: number;
  arch_db: string;
}

interface CrudFlags {
  perm_create: boolean;
  perm_read: boolean;
  perm_write: boolean;
  perm_unlink: boolean;
}

export interface ModelAccessRight extends CrudFlags {
  id: number;
  name: string;
  group_id: Many2one;
}

export interface ModelRecordRule extends CrudFlags {
  id: number;
  name: string;
  domain_force: string | false;
  groups: number[];
}

export interface IrAccess {
  id: number;
  name: string;
  group_id: Many2one;
  for_create: boolean;
  for_read: boolean;
  for_write: boolean;
  for_unlink: boolean;
  domain: string | false;
}

export interface FieldDetails {
  id: number;
  name: string;
  field_description: string;
  ttype: string;
  relation: string | false;
  relation_field: string | false;
  required: boolean;
  readonly: boolean;
  store: boolean;
  compute: string | false;
  depends: string | false;
  copied: boolean;
  help: string | false;
  size: string | false;
  translate: boolean;
  index: boolean;
  domain: string | false;
  groups: number[];
  on_delete: string | false;
  related: string | false;
  modules: string | false;
}

const pageContextRpc = createOdooRpc({
  getOrigin: async () => "",
});

const call = <T>(
  model: string,
  method: string,
  args: unknown[],
  kwargs: Record<string, unknown> = {},
): Promise<T> => pageContextRpc.executeRpc({ model, method, args, kwargs }) as Promise<T>;

const searchRead = <T>(
  model: string,
  domain: Domain,
  fields: string[],
  kwargs: Record<string, unknown> = {},
) => call<T[]>(model, "search_read", [domain, fields], kwargs);

const ofModel = (model: string): Domain => [["model_id.model", "=", model]];

export const searchIds = async (model: string, domain: Domain): Promise<number[]> =>
  (await searchRead<{ id: number }>(model, domain, ["id"])).map((record) => record.id);

export const readRecord = async (
  model: string,
  id: number,
): Promise<Record<string, unknown> | null> =>
  (await call<Record<string, unknown>[]>(model, "read", [[id]]))[0] ?? null;

/** Opens the records (by ids or domain) in an Odoo dialog. */
export const openRecords = async (
  model: string,
  records: { ids: number[] } | { domain: Domain },
  title: string,
): Promise<void> => {
  const action = buildActWindowAction({
    model,
    recordIds: "ids" in records ? records.ids : undefined,
    domain: "domain" in records ? records.domain : undefined,
    asPopup: true,
    title,
  });
  await executeOdooAction(window.odoo, { action });
};

export const getModelAccessRights = (model: string) =>
  searchRead<ModelAccessRight>("ir.model.access", ofModel(model), [
    "name",
    "group_id",
    "perm_read",
    "perm_write",
    "perm_create",
    "perm_unlink",
  ]);

export const getModelRecordRules = (model: string) =>
  searchRead<ModelRecordRule>("ir.rule", ofModel(model), [
    "name",
    "groups",
    "domain_force",
    "perm_read",
    "perm_write",
    "perm_create",
    "perm_unlink",
  ]);

export const getIrAccess = (model: string) =>
  searchRead<IrAccess>("ir.access", ofModel(model), [
    "name",
    "group_id",
    "for_read",
    "for_write",
    "for_create",
    "for_unlink",
    "domain",
  ]);

export const getGroupNames = async (groupIds: number[]): Promise<Record<number, string>> => {
  if (groupIds.length === 0) return {};
  const groups = await searchRead<{ id: number; display_name: string }>(
    "res.groups",
    [["id", "in", groupIds]],
    ["display_name"],
  );
  return Object.fromEntries(groups.map((group) => [group.id, group.display_name]));
};

export const getFieldDetails = async (
  model: string,
  fieldName: string,
): Promise<FieldDetails | null> => {
  const [details] = await searchRead<FieldDetails>(
    "ir.model.fields",
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
    { limit: 1 },
  );
  return details ?? null;
};

const VIEW_FIELDS = ["name", "xml_id", "key", "priority", "arch_db"];

export const getBaseView = async (model: string, viewType: string): Promise<ViewRecord | null> => {
  const [view] = await searchRead<ViewRecord>(
    "ir.ui.view",
    [
      ["model", "=", model],
      ["type", "=", viewType],
      ["inherit_id", "=", false],
    ],
    VIEW_FIELDS,
    { limit: 1, order: "priority" },
  );
  return view ?? null;
};

export const getInheritedViews = (parentViewId: number) =>
  searchRead<ViewRecord>("ir.ui.view", [["inherit_id", "=", parentViewId]], VIEW_FIELDS, {
    order: "priority",
  });
