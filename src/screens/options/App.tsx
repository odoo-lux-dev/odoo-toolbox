import "@/theme/index.css";
import { Match, Switch } from "solid-js";

import { useExtensionTheme } from "@/hooks/use-extension-theme";
import { OptionsLayout } from "@/screens/options/components/options-layout";
import { route } from "@/screens/options/options-nav";

import { FavoritesPage } from "./pages/favorites-page";
import { OptionsPage } from "./pages/options-page";

export const App = () => {
  useExtensionTheme();

  return (
    <OptionsLayout>
      <Switch fallback={<OptionsPage />}>
        <Match when={route() === "favorites"}>
          <FavoritesPage />
        </Match>
      </Switch>
    </OptionsLayout>
  );
};
