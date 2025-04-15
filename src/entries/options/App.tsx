import "./style.scss"
import { Route, Router, CustomHistory } from "preact-router"
import { OptionsLayout } from "@/components/options/options-layout"
import { createHashHistory } from "history"
import { OptionsPage } from "./pages/options-page"
import { FavoritesPage } from "./pages/favorites-page"

export const App = () => {
  const history = createHashHistory()
  const customHistory: CustomHistory = {
    listen: (callback) => {
      return history.listen(({ location }) => {
        callback(location)
      })
    },
    location: history.location,
    push: history.push,
    replace: history.replace,
  }

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
  )
}
