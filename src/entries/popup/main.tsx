import { render } from "preact"
import { App } from "./App"
import { PopupProvider } from "@/components/popup/popup-context"

render(
  <PopupProvider>
    <App />
  </PopupProvider>,
  document.body
)
