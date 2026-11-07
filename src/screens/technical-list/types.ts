/** Odoo modifier as found in the debug tooltips: a boolean, "True"/"1"/..., or a Python expression. */
export type Modifier = boolean | string | null | undefined;

export type ButtonType = "object" | "action";

export interface DebugFieldInfo {
  name: string;
  label: string;
  type: string;
  widget: string | null;
  context: string | null;
  domain: unknown[] | null;
  invisible: Modifier;
  column_invisible: Modifier;
  readonly: Modifier;
  required: Modifier;
  changeDefault: boolean;
  relation: string | null;
  compute?: string | null;
  related?: string | null;
  store?: boolean | null;
  selection?: Array<[string, string]> | null;
  resModel?: string | null;
}

export interface DebugButtonInfo {
  name: string;
  type: ButtonType;
  string?: string;
  invisible?: Modifier;
  context?: unknown;
  confirm?: string;
  help?: string;
  icon?: string;
}

export interface FieldInfo {
  name: string;
  type: string;
  label: string;
  value: string;
  canBeRequired: boolean;
  canBeReadonly: boolean;
  debugInfo?: DebugFieldInfo;
}

export interface ButtonInfo {
  name: string;
  type: ButtonType;
  label: string;
  hotkey?: string;
  debugInfo?: DebugButtonInfo;
}

export interface WebsiteInfo {
  websiteId: string;
  mainObject: string;
  viewXmlId: string | null;
  viewId: string | null;
  isLogged: boolean;
  language: string | null;
}

export interface ControllerInfo {
  currentModel?: string;
  currentRecordId?: number;
  viewType?: string;
  actionName?: string;
  actionXmlId?: string;
  actionType?: string;
  actionId?: number;
  actionContext?: string;
  actionDomain?: string;
}

export interface ViewInfo extends ControllerInfo {
  technicalFields: FieldInfo[];
  technicalButtons: ButtonInfo[];
  websiteInfo?: WebsiteInfo;
}

export type DebugMode = "disabled" | "enabled" | "assets" | "tests";

export interface DatabaseInfo {
  version?: string;
  database?: string;
  serverInfo?: string;
  language?: string;
  debugMode: DebugMode;
}

/** Element of the Odoo page a panel card points at. */
export type ElementTarget =
  | { kind: "field"; name: string }
  | { kind: "button"; name: string; type: ButtonType };
