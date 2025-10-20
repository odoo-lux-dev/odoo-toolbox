import { createHashHistory } from "history";
import { render } from "preact";
import { App } from "./App";

const history = createHashHistory();

if (history.location.pathname === "/") {
    history.replace("/options");
}

render(<App />, document.body);
