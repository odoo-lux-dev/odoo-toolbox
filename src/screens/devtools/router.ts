import {
  Add01Icon,
  Clock01Icon,
  CommandLineIcon,
  Delete02Icon,
  PencilEdit01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { makeEventListener } from "@solid-primitives/event-listener";
import { createRoot, createSignal } from "solid-js";

import type { IconData } from "@/components/ui/hugeicons-icon";

export type TabId = "search" | "write" | "create" | "call-method" | "unlink" | "history";

export interface TabDefinition {
  id: TabId;
  path: string;
  labelKey: string;
  icon: IconData;
}

export const TABS: readonly TabDefinition[] = [
  {
    id: "search",
    path: "/search",
    labelKey: "devtools.nav.search",
    icon: Search01Icon,
  },
  {
    id: "write",
    path: "/write",
    labelKey: "devtools.nav.write",
    icon: PencilEdit01Icon,
  },
  {
    id: "create",
    path: "/create",
    labelKey: "devtools.nav.create",
    icon: Add01Icon,
  },
  {
    id: "call-method",
    path: "/call-method",
    labelKey: "devtools.nav.call_method",
    icon: CommandLineIcon,
  },
  {
    id: "unlink",
    path: "/unlink",
    labelKey: "devtools.nav.unlink",
    icon: Delete02Icon,
  },
  {
    id: "history",
    path: "/history",
    labelKey: "devtools.nav.history",
    icon: Clock01Icon,
  },
];

const tabById = (id: TabId): TabDefinition => TABS.find((tab) => tab.id === id)!;

const readRoute = () => window.location.hash.slice(1);
const [route, setRoute] = createSignal(readRoute());
createRoot(() => {
  makeEventListener(window, "hashchange", () => setRoute(readRoute()));
});

/** Active tab; unknown routes fall back to the search tab. */
export const currentTab = (): TabDefinition =>
  TABS.find((tab) => tab.path === route()) ?? tabById("search");

export const navigate = (id: TabId) => {
  window.location.hash = tabById(id).path;
};

// Old name kept so the stored choice survives.
const RAIL_STORAGE_KEY = "ot-devtools-query-rail-collapsed";

const readRailCollapsed = () => {
  try {
    return window.localStorage.getItem(RAIL_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
};

const [railCollapsed, setRailCollapsed] = createSignal(readRailCollapsed());

export { railCollapsed };

export const toggleRail = () => {
  const next = !railCollapsed();
  setRailCollapsed(next);
  try {
    window.localStorage.setItem(RAIL_STORAGE_KEY, next ? "1" : "0");
  } catch {
    // Storage unavailable: the choice only lasts for this session.
  }
};
