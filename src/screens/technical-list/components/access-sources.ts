import { CheckmarkBadge02Icon, Key01Icon, Shield02Icon } from "@hugeicons/core-free-icons";

import { type IconData } from "@/components/ui/hugeicons-icon";
import {
  getGroupNames,
  getIrAccess,
  getModelAccessRights,
  getModelRecordRules,
  openRecords,
} from "@/services/content-script-rpc-service";
import { getOdooInfoFromWindow } from "@/services/owl-runtime";
import { t } from "@/utils/i18n-page";

import { formatGroups, type CrudPermissions } from "./detail-parts";

export interface AccessRow {
  id: number;
  name: string;
  /** Label and value of the group line (omitted when not relevant). */
  groups?: { label: string; value: string };
  domain?: string | false;
  permissions: CrudPermissions;
}

export interface AccessSection {
  key: string;
  title: string;
  icon: IconData;
  description?: string;
  emptyLabel: string;
  /** `table`: one row per group (model access rights); `cards`: rules with a domain. */
  layout: "table" | "cards";
  rows: AccessRow[];
  openDetails: () => Promise<void>;
}

/** `ir.access` replaces `ir.model.access` and `ir.rule` from Odoo 19.4. */
const IR_ACCESS_VERSION = 19.4;

const usesIrAccess = () => (getOdooInfoFromWindow(window.odoo).version ?? 0) >= IR_ACCESS_VERSION;

/** Odoo < 19.4: model access rights (per group) and record rules. */
const loadLegacyAccess = async (model: string): Promise<AccessSection[]> => {
  const [rights, rules] = await Promise.all([
    getModelAccessRights(model),
    getModelRecordRules(model),
  ]);
  const groupNames = await getGroupNames([...new Set(rules.flatMap((rule) => rule.groups))]);

  return [
    {
      key: "access-rights",
      title: t("technical_list.model_actions.access_rights"),
      icon: Key01Icon,
      emptyLabel: t("technical_list.model_actions.no_access_rights"),
      layout: "table",
      rows: rights.map((right) => ({
        id: right.id,
        name: right.group_id ? right.group_id[1] : t("technical_list.model_actions.all_groups"),
        permissions: {
          create: right.perm_create,
          read: right.perm_read,
          write: right.perm_write,
          unlink: right.perm_unlink,
        },
      })),
      openDetails: () =>
        openRecords(
          "ir.model.access",
          { ids: rights.map((right) => right.id) },
          t("technical_list.model_actions.view_title_access", [model]),
        ),
    },
    {
      key: "record-rules",
      title: t("technical_list.model_actions.record_rules"),
      icon: Shield02Icon,
      emptyLabel: t("technical_list.model_actions.no_record_rules"),
      layout: "cards",
      rows: rules.map((rule) => ({
        id: rule.id,
        name: rule.name,
        groups: {
          label: t("technical_list.model_actions.groups"),
          value:
            rule.groups.length > 0
              ? formatGroups(rule.groups, groupNames)
              : t("technical_list.model_actions.global"),
        },
        domain: rule.domain_force,
        permissions: {
          create: rule.perm_create,
          read: rule.perm_read,
          write: rule.perm_write,
          unlink: rule.perm_unlink,
        },
      })),
      openDetails: () =>
        openRecords(
          "ir.rule",
          { ids: rules.map((rule) => rule.id) },
          t("technical_list.model_actions.view_title_rules", [model]),
        ),
    },
  ];
};

const IR_ACCESS_KINDS = {
  permission: {
    title: () => t("technical_list.model_actions.permissions"),
    description: () => t("technical_list.model_actions.permissions_desc"),
    emptyLabel: () => t("technical_list.model_actions.no_permissions"),
    viewTitle: (model: string) => t("technical_list.model_actions.view_title_permissions", [model]),
    icon: CheckmarkBadge02Icon,
  },
  restriction: {
    title: () => t("technical_list.model_actions.restrictions"),
    description: () => t("technical_list.model_actions.restrictions_desc"),
    emptyLabel: () => t("technical_list.model_actions.no_restrictions"),
    viewTitle: (model: string) =>
      t("technical_list.model_actions.view_title_restrictions", [model]),
    icon: Shield02Icon,
  },
};

/** Odoo >= 19.4: `ir.access` permissions (with a group) and restrictions (global). */
const loadIrAccess = async (model: string): Promise<AccessSection[]> => {
  const accesses = await getIrAccess(model);
  return (["permission", "restriction"] as const).map((kind) => {
    const config = IR_ACCESS_KINDS[kind];
    return {
      key: kind,
      title: config.title(),
      icon: config.icon,
      description: config.description(),
      emptyLabel: config.emptyLabel(),
      layout: "cards",
      rows: accesses
        .filter((access) => !!access.group_id === (kind === "permission"))
        .map((access) => ({
          id: access.id,
          name: access.name,
          groups: access.group_id
            ? { label: t("technical_list.model_actions.group"), value: access.group_id[1] }
            : undefined,
          domain: access.domain,
          permissions: {
            create: access.for_create,
            read: access.for_read,
            write: access.for_write,
            unlink: access.for_unlink,
          },
        })),
      openDetails: () =>
        openRecords(
          "ir.access",
          {
            domain: [
              ["model_id.model", "=", model],
              ["kind", "=", kind],
            ],
          },
          config.viewTitle(model),
        ),
    };
  });
};

export const loadAccessSections = (model: string) =>
  usesIrAccess() ? loadIrAccess(model) : loadLegacyAccess(model);
