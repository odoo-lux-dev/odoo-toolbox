import "./style.scss";
import { createHashHistory } from "history";
import { useEffect } from "preact/hooks";
import { CustomHistory, Route, Router } from "preact-router";
import { OptionsLayout } from "@/components/options/options-layout";
import { setupOptionsWatchers } from "@/contexts/options-signals";
import { useOptions } from "@/contexts/options-signals-hook";
import { FavoritesPage } from "./pages/favorites-page";
import { OptionsPage } from "./pages/options-page";

export const App = () => {
    const { initializeOptions } = useOptions();
    const history = createHashHistory();
    const customHistory: CustomHistory = {
        listen: (callback) => {
            return history.listen(({ location }) => {
                callback(location);
            });
        },
        location: history.location,
        push: history.push,
        replace: history.replace,
    };

    useEffect(() => {
        initializeOptions();
        const cleanup = setupOptionsWatchers();
        return cleanup;
    }, []);

    return (
        <Router history={customHistory}>
            <Route
                path="/"
                component={() => (
                    <OptionsLayout>
                        <OptionsPage />
                    </OptionsLayout>
                )}
            />
            <Route
                path="/options"
                component={() => (
                    <OptionsLayout>
                        <OptionsPage />
                    </OptionsLayout>
                )}
            />
            <Route
                path="/favorites"
                component={() => (
                    <OptionsLayout>
                        <FavoritesPage />
                    </OptionsLayout>
                )}
            />
        </Router>
    );
};
