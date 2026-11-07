import { createSignal } from "solid-js";

/** What the inspected page offers, refreshed on every navigation of the inspected tab. */
export const [hasHostPermission, setHasHostPermission] = createSignal<boolean | null>(null);
export const [isSupportedSignal, setIsSupportedSignal] = createSignal<boolean | null>(null);
export const [odooVersionSignal, setOdooVersionSignal] = createSignal<string | null>(null);
export const [databaseSignal, setDatabaseSignal] = createSignal<string | undefined>(undefined);
