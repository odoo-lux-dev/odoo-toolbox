import { render } from "solid-js/web";

import { DevtoolsApp } from "@/screens/devtools/App";
import { initI18n } from "@/services/i18n-service";

await initI18n();

render(() => <DevtoolsApp />, document.getElementById("root")!);
