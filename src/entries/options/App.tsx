import "./style.css";
import { createHashHistory } from "history";
import { useEffect } from "preact/hooks";
import { CustomHistory, Route, Router } from "preact-router";
import { OptionsLayout } from "@/components/options/options-layout";
import {
    initializeOptions,
    setupOptionsWatchers,
} from "@/contexts/options-signals";
import { FavoritesPage } from "./pages/favorites-page";
import { OptionsPage } from "./pages/options-page";

export const App = () => {
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
