import "./style.css";
import { Switch, Match, createSignal, onMount, onCleanup } from "solid-js";

import { OptionsLayout } from "@/screens/options/components/options-layout";
import { initializeOptions, setupOptionsWatchers } from "@/screens/options/options-signals";

import { FavoritesPage } from "./pages/favorites-page";
import { OptionsPage } from "./pages/options-page";

const getRoute = () => {
  const raw = window.location.hash.slice(1).replace(/^\//, "");
  const routePart = raw.split("#")[0] || "home";
  return routePart;
};

export const App = () => {
  const [route, setRoute] = createSignal(getRoute());

  onMount(() => {
    const handler = () => setRoute(getRoute());
    window.addEventListener("hashchange", handler);
    onCleanup(() => window.removeEventListener("hashchange", handler));

    initializeOptions();
    const cleanup = setupOptionsWatchers();
    onCleanup(cleanup);
  });

  return (
    <Switch>
      <Match when={route() === "options"}>
        <OptionsLayout>
          <OptionsPage />
        </OptionsLayout>
      </Match>
      <Match when={route() === "favorites"}>
        <OptionsLayout>
          <FavoritesPage />
        </OptionsLayout>
      </Match>
      <Match when={route() === "home" || route() === ""}>
        <OptionsLayout>
          <OptionsPage />
        </OptionsLayout>
      </Match>
    </Switch>
  );
};
