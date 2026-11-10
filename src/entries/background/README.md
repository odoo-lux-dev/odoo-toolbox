# Background service worker

`index.ts` is the extension's background: the only context with every extension API
(`declarativeNetRequest`, `alarms`, `commands`, `contextMenus`, `scripting` on any tab). Read
[`AGENTS.md`](../../../AGENTS.md) section 4 for the other contexts.

## What it does

`defineBackground` in `index.ts` registers:

| Listener | Behaviour |
| -------- | --------- |
| `runtime.onStartup`, `runtime.onInstalled` | On startup and on a new install, aligns local data with the synced data (unless sync is empty); on an update, keeps the migrated local data and persists it to `sync:`. (Re)creates alarms, opens the update page (`update.html`) after an update when `updateService` says so |
| `alarms.onAlarm` | `persist-local-data` (every minute): copies the changed local data to `sync:` and records the outcome (`syncStatus`, shown in Options) |
| `commands.onCommand` | `toggle-debug` (see `toggleDebugMode` in `services/debug-mode-service.ts`) |
| `runtime.onMessage` | I18n requests (`entries/background/i18n.ts`) and DevTools page-script requests (`entries/background/devtools.ts`) |
| `runtime.onMessageExternal` | Imports the configuration sent by the legacy Odoo.sh extension (public ID checked per browser) |
| `webNavigation.onHistoryStateUpdated` | Tells Odoo.sh tabs about SPA route changes (`ODOOSH_ROUTE_CHANGED`) |
| `webNavigation.onCommitted` | Debug-mode reload fallback for backend pages of hosts not yet learned |

`registerContextMenuHandlers()` (`context-menu.ts`) adds the "ignore debug mode" items, and
`debugModeRulesService.start()` keeps the network rules in sync.

## Files

| File | Role |
| ---- | ---- |
| `index.ts` | Wiring above, reload fallback, external messages |
| `devtools.ts` | Runs a DevTools page script in the MAIN world of the inspected tab (`callPageRuntime`, injected with `func`, so it must stay self-contained) |
| `i18n.ts` | Serves the translations of a locale to the other contexts (`loadMessages`) |
| `context-menu.ts` | Context menu items to ignore debug mode per domain, path or both; titles read from the locale messages |
| `devtools.test.ts` | Unit tests of the DevTools relay |

Related modules outside this folder:

- `services/debug-mode-rules-service.ts`: builds and applies the `declarativeNetRequest`
  dynamic rules (`utils/debug-mode-rules.ts`), and stores the hosts learned as Odoo.
- `services/debug-mode-service.ts`: the toggle command and tab refresh.
- `services/configuration-service.ts`: sync and import/export of the user data.

## Debug mode, from the background's side

1. Settings or known hosts change → `debugModeRulesService` rebuilds the dynamic rules
   (replaces all of them, skips the write when the serialized rules did not change).
2. A backend page commits (`onCommitted`, main frame only):
   - the default debug mode must be set, otherwise nothing happens;
   - the background reads `window.odoo.debug` in the page (MAIN world). A non-injectable tab
     (`chrome://`, Web Store) is ignored;
   - the host is remembered (`rememberHost`) **before** any early return, so later pages of
     that host are covered by the network rules;
   - on Runbot builds with auto-login on, the reload is left to the page script;
   - otherwise `getDebugModeUrl()` gives the target URL and the tab is updated.

Why there are two mechanisms: the network rules avoid rendering a page without debug mode,
but they can only target hosts already known. See `AGENTS.md` section 8.

## Rules when editing

- Keep `onCommitted` fast and failure-tolerant: each `await` can fail on a closed tab.
  Errors are caught where the browser API can reject (`executeScript`).
- Do not add a listener that calls an extension API without checking it exists on Firefox
  (`browser.declarativeNetRequest` is optional there).
- Alarms are declared in `ALARMS`; `checkAndHandleAlarms()` removes the unknown ones. Add new
  periodic work there.
- Commands are declared in `wxt.config.ts` and dispatched through `COMMANDS`.
- Messages must be typed in `services/extension-messages.ts` and return `true` from
  `onMessage` when the response is async.
- Keep the external message sender check: it is the only gate on `onMessageExternal`.

## Tests

`devtools.test.ts` covers the DevTools relay. Debug-mode rules are tested in
`utils/debug-mode-rules.test.ts` and `utils/debug-mode-url.test.ts`. The listeners
themselves are not unit-tested: check them in a loaded extension (`bun dev`).
