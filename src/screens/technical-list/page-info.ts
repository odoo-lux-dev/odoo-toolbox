/** Reads the technical context exposed by the Odoo web client (`window.odoo`). */
import { getOdooInfoFromWindow, resolveDoActionFunction } from "@/services/owl-runtime";
import { t } from "@/utils/i18n-page";
import { getCurrentController, isOnSpecificRecordPage } from "@/utils/odoo-page";

import type { ControllerInfo, DatabaseInfo, DebugMode } from "./types";

const DEBUG_MODES: Record<string, DebugMode> = {
  "1": "enabled",
  assets: "assets",
  "assets,tests": "tests",
};

const nonEmptyJson = (value: unknown): string | undefined => {
  if (Array.isArray(value)) return value.length > 0 ? JSON.stringify(value) : undefined;
  if (value && typeof value === "object" && Object.keys(value).length > 0) {
    return JSON.stringify(value);
  }
  return undefined;
};

const requireOdoo = () => {
  if (!window.odoo) throw new Error(t("technical_list.errors.odoo_not_found"));
  return window.odoo;
};

export const readControllerInfo = (): ControllerInfo => {
  requireOdoo();
  const controller = getCurrentController();
  const action = controller?.action;
  const localState = isOnSpecificRecordPage() ? controller?.getLocalState?.() : undefined;
  return {
    currentModel: controller?.props?.resModel,
    currentRecordId: localState?.resId || localState?.currentId,
    viewType: controller?.view?.type,
    actionName: action?.name,
    actionXmlId: action?.xml_id,
    actionType: action?.type,
    actionId: action?.id,
    actionDomain: nonEmptyJson(action?.domain),
    actionContext: Array.isArray(action?.context) ? undefined : nonEmptyJson(action?.context),
  };
};

export const readDatabaseInfo = (): DatabaseInfo => {
  const odoo = requireOdoo();
  const { version, database } = getOdooInfoFromWindow(odoo);
  const root = odoo.__WOWL_DEBUG__?.root;
  return {
    version: version === null ? undefined : String(version),
    database,
    serverInfo: (odoo.info || odoo.session_info)?.server_version,
    debugMode: DEBUG_MODES[odoo.debug ?? ""] ?? "disabled",
    language: root?.localization?.code || root?.user?.lang || odoo.session_info?.user_context?.lang,
  };
};

/** Whether the web client can open views (its action service is missing on some pages). */
export const canOpenViews = () => !!resolveDoActionFunction(window.odoo);
