import { render } from "solid-js/web";

import { App } from "@/screens/update/App";
import { initI18n } from "@/services/i18n-service";

await initI18n();

render(() => <App />, document.getElementById("root")!);
