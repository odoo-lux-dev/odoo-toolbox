import { render } from "preact"
import { App } from "./App"
import { OptionsProvider } from "@/components/options/options-context"
import { createHashHistory } from "history"

const history = createHashHistory()

if (history.location.pathname === "/") {
  history.replace("/options")
}

render(
  <OptionsProvider>
    <App />
  </OptionsProvider>,
  document.body
)
