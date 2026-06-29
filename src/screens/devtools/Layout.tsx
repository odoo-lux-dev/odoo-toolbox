import { makeEventListener } from "@solid-primitives/event-listener";
import { createSignal, createRoot, For, type JSX } from "solid-js";

import { Tab, Tabs } from "@/components/ui/tabs";
import { t } from "@/services/i18n-service";

interface DevToolsLayoutProps {
  children: JSX.Element;
  currentPath: string;
}

interface NavItem {
  id: string;
  label: string;
  path: string;
}

const navItems = (): NavItem[] => [
  { id: "search", label: t("devtools.nav.search"), path: "/search" },
  { id: "write", label: t("devtools.nav.write"), path: "/write" },
  { id: "create", label: t("devtools.nav.create"), path: "/create" },
  { id: "call-method", label: t("devtools.nav.call_method"), path: "/call-method" },
  { id: "unlink", label: t("devtools.nav.unlink"), path: "/unlink" },
  { id: "history", label: t("devtools.nav.history"), path: "/history" },
];

const getRoute = () => window.location.hash.slice(1) || "/search";
export const [route, setRoute] = createSignal(getRoute());
export const navigate = (path: string) => {
  window.location.hash = path;
};
createRoot(() => {
  makeEventListener(window, "hashchange", () => setRoute(getRoute()));
});

export const DevToolsLayout = (props: DevToolsLayoutProps) => {
  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div class="devtools-app flex h-screen min-h-0 flex-col overflow-hidden bg-base-300 text-base-content">
      <nav class="devtools-nav bg-base-300">
        <Tabs variant="bordered" class="px-6">
          <For each={navItems()}>
            {(item) => (
              <Tab
                active={props.currentPath === item.path}
                onClick={() => handleNavigation(item.path)}
              >
                {item.label}
              </Tab>
            )}
          </For>
        </Tabs>
      </nav>

      <main class="devtools-content flex min-h-0 flex-1 flex-col bg-base-100">
        {props.children}
      </main>
    </div>
  );
};
