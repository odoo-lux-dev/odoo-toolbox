import { render } from "solid-js/web";

import { App } from "@/screens/popup/App";
import { initI18n } from "@/services/i18n-service";

await initI18n();

render(() => <App />, document.body);
