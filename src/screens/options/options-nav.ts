import { createRoot, createSignal } from "solid-js";

import { SETTINGS_SECTIONS, type SettingsSection } from "@/screens/options/sections";

/**
 * Navigation state of the options page: current route, section in view,
 * mobile drawer and the global search query. Shared by the layout, the
 * sidebar, the top bar and the pages.
 */

type OptionsRoute = "options" | "favorites";

const parseRoute = (): OptionsRoute => {
  const raw = window.location.hash.slice(1).replace(/^\//, "");
  return raw.split("#")[0] === "favorites" ? "favorites" : "options";
};

const state = createRoot(() => {
  const [route, setRoute] = createSignal<OptionsRoute>(parseRoute());
  const [activeSection, setActiveSection] = createSignal<SettingsSection>(SETTINGS_SECTIONS[0].id);
  const [drawerOpen, setDrawerOpen] = createSignal(false);
  const [searchQuery, setSearchQuery] = createSignal("");

  window.addEventListener("hashchange", () => {
    const next = parseRoute();
    if (next !== route()) setSearchQuery("");
    setRoute(next);
    setDrawerOpen(false);
  });

  return {
    route,
    activeSection,
    setActiveSection,
    drawerOpen,
    setDrawerOpen,
    searchQuery,
    setSearchQuery,
  };
});

export const {
  route,
  activeSection,
  setActiveSection,
  drawerOpen,
  setDrawerOpen,
  searchQuery,
  setSearchQuery,
} = state;

export const SCROLL_CONTAINER_ID = "content-container";

/** Scrolls the options content to a section (the first one scrolls to the top). */
export const scrollToSection = (id: SettingsSection) => {
  const container = document.getElementById(SCROLL_CONTAINER_ID);
  const element = document.getElementById(id);
  if (!container || !element) return;
  const top =
    id === SETTINGS_SECTIONS[0].id
      ? 0
      : element.getBoundingClientRect().top -
        container.getBoundingClientRect().top +
        container.scrollTop -
        24;
  container.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
};

/** Runs `then` on the settings page, navigating to it first if needed. */
const onSettingsPage = (then: () => void) => {
  if (route() === "options") return then();
  // Registered after the router listener: the page is rendered when it runs.
  window.addEventListener("hashchange", then, { once: true });
  window.location.hash = "#/options";
};

export const goToSection = (section: SettingsSection) =>
  onSettingsPage(() => scrollToSection(section));

/** Classes flashed on the target of a "go to" command (theme utilities only). */
const HIGHLIGHT_CLASSES = ["ring-2", "ring-primary", "ring-offset-2", "ring-offset-canvas"];

/** Scrolls to a setting card or item and flashes it. */
export const goToSetting = (id: string) =>
  onSettingsPage(() => {
    const element = document.getElementById(id);
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    element.classList.add(...HIGHLIGHT_CLASSES);
    window.setTimeout(() => element.classList.remove(...HIGHLIGHT_CLASSES), 1600);
  });
