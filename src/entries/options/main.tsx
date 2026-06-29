import { render } from "solid-js/web";

import { App } from "@/screens/options/App";
import { initI18n } from "@/services/i18n-service";

await initI18n();

if (!window.location.hash || window.location.hash === "#/") {
  window.location.hash = "#/options";
}

render(() => <App />, document.body);
