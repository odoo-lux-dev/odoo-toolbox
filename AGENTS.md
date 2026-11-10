# Odoo Toolbox: guide for agents

Browser extension (Chrome MV3, Firefox MV2) that adds developer and Odoo.sh tools to Odoo
pages: a DevTools panel for RPC and data exploration, a technical sidebar, debug mode
handling, Odoo.sh enhancements, Runbot shortcuts and UI themes.

This guide describes the code as it is on the current branch. Each surface has its own README (linked in section 14). When the code and this file disagree,
trust the code and fix this file.

---

## 1. Stack and commands

- Solid.js + TypeScript, built with WXT (`wxt.config.ts`, sources in `src/`, entries in
  `src/entries/`), Tailwind CSS 4 + DaisyUI 5, Bun as package manager and test runner.
- Commands (run from the repo root, with Bun):

| Command                           | Purpose                                                  |
| --------------------------------- | -------------------------------------------------------- |
| `bun install`                     | Install dependencies (`postinstall` runs `wxt prepare`)  |
| `bun dev` / `bun dev:firefox`     | Watch build with auto-reload                             |
| `bun build` / `bun build:firefox` | Production build into `dist/`                            |
| `bun zip` / `bun zip:firefox`     | Store-ready zip                                          |
| `bun test`                        | Unit tests (`bun:test`, happy-dom, see section 12)       |
| `bun run compile`                 | `tsc --noEmit`                                           |
| `bun lint` / `bun lint:fix`       | `oxlint` (type-aware through `oxlint-tsgolint`)          |
| `bun format` / `bun format:check` | `oxfmt`                                                  |

Run `bun test`, `bun run compile` and `bun lint` before reporting a change as done.
`dist/` is git-ignored.

## 2. Repository map

| Path                        | Content                                                                                  |
| --------------------------- | ---------------------------------------------------------------------------------------- |
| `src/entries/`              | One folder or file per WXT entrypoint (background, popup, options, devtools, content scripts, unlisted page scripts) |
| `src/page-features/`        | Features that run inside Odoo pages (see `src/page-features/README.md`)                  |
| `src/screens/`              | Solid UIs: `popup`, `options`, `update`, `devtools` (panel), `technical-list` (sidebar), `shared` |
| `src/components/ui/`        | Shared UI primitives (Button, Modal, Tabs, Tooltip, Popover, CommandPalette...)          |
| `src/services/`             | Stateful services: storage stores, settings, favorites, history, RPC clients, messaging, i18n, logger |
| `src/utils/`                | Pure helpers (domains, debug-mode URLs and rules, settings schema, host detection, cookies...) |
| `src/types/`                | Shared types. `settings.types.ts` holds the setting value lists                           |
| `src/theme/`                | UI themes and the design-token contract (see `src/theme/README.md`)                      |
| `src/hooks/`                | Solid hooks shared by the screens (`useExtensionTheme`, `useSettings`...)                |
| `src/locales/*.yml`         | Translations (en is the source of truth)                                                 |
| `src/utils/odoo-py_js/`    | Odoo's own Python-expression evaluator, LGPLv3, kept unmodified (see its README)         |
| `tests/`                    | Test preload (`setup.ts`: DOM and in-memory `wxt/utils/storage`)                         |
| `docs/`                     | Research notes (e.g. `docs/onchange-mechanism.md`), not product code                      |
| `.fusion/`                  | Tooling state of an agent orchestrator, not extension code: do not edit                   |
| `dist/`                     | Build output (git-ignored)                                                               |

## 3. Targets and manifest

Defined in `wxt.config.ts`:

- **Chrome** (MV3): `host_permissions: ["*://*/*"]`.
- **Firefox** (MV2): `browser_specific_settings.gecko` (id `odoo_toolbox@thcl-saju`), and
  `<all_urls>` added to the permissions.
- Permissions: `storage`, `tabs`, `alarms`, `scripting`, `clipboardWrite`, `webNavigation`,
  `contextMenus`, `declarativeNetRequestWithHostAccess`.
- Commands: `toggle-debug` (`Ctrl+Shift+D` / `Command+Shift+D`) and the popup action.
- `web_accessible_resources`: `odoo-websites.js` and `odoo-technical-list.js` (any `*://*/*`).
- `default_locale: "en"`. Translations use `browser.i18n` keys from the YAML files.

Any new permission must be justified in the root `README.md` ("Extension Permissions" table).

## 4. Execution contexts

Code runs in several isolated contexts. Know which one you are in before you call an API.

| Context | Entry (`src/entries/`) | Runs | Can use `browser.*` | Sees `window.odoo` |
| ------- | ---------------------- | ---- | ------------------- | ------------------ |
| Background service worker / event page | `background/index.ts` | Listeners, alarms, commands, context menus, DNR rules, reload fallback, external messages | Yes (all) | No |
| Global content script (isolated world, every `*://*/*`) | `global.content/index.ts` | Initialises i18n, writes settings to `document.body.dataset`, injects the page scripts below | Yes (limited) | No |
| `odoo-websites.js` (page world, injected by global content) | `odoo-websites.ts` | Odoo UI enhancements: login buttons, debug mode, default color scheme, technical model names, print options, Runbot auto-login | No | Yes |
| `odoo-technical-list.js` (page world, only if `showTechnicalList`) | `odoo-technical-list.ts` | Mounts the technical sidebar in a shadow root | No | Yes |
| `odoo-page-runtime.js` (page world, injected on demand by the background) | `odoo-page-runtime.ts` | Exposes `runPageScript` for DevTools page helpers | No | Yes |
| Odoo.sh content script (`*.odoo.sh/project*`, `/paas/*`) | `odoosh.content/index.ts` | Odoo.sh project list and project page features, log download | Yes (limited) | No |
| DevTools panel (`devtools-panel.html`) | `devtools-panel/` (screen: `screens/devtools`) | RPC client, query UI, history | Yes (limited) | Via messages only |
| Popup, options, update page | `popup/`, `options/`, `update/` | Extension UIs | Yes | No |

Consequences:

- Page-world scripts (`odoo-*.js`) cannot call extension APIs. They read settings from
  `document.body.dataset` (written by the global content script) and talk to the background
  only through DOM events or the messages the content script forwards.
- `window.odoo` is only visible in the page world. Code that reads it must run there, or be
  injected there with `scripting.executeScript({ world: "MAIN" })`.
- `background/devtools.ts` injects `func` into the inspected tab. Such a function must be
  self-contained (no closure, no import), like `callPageRuntime`.

## 5. Messaging

All message types and their payloads are in `src/services/extension-messages.ts`:

- `I18N_GET_MESSAGES`: extension pages and content scripts ask the background for the
  translations of a locale (`entries/background/i18n.ts`).
- `DEVTOOLS_PAGE_SCRIPT`: the DevTools panel asks the background to run a page helper
  (`GET_ODOO_INFO`, `GET_CURRENT_PAGE_INFO`, `EXECUTE_ODOO_ACTION`) in the inspected tab
  (`entries/background/devtools.ts`, called from `services/odoo-rpc-service.ts`).
- `ODOOSH_ROUTE_CHANGED`: sent by the background on `webNavigation.onHistoryStateUpdated`
  to Odoo.sh tabs, because the Odoo.sh SPA navigates with the History API.
- `onMessageExternal`: accepts only the public extension ID of the legacy "Odoo.sh"
  extension (per browser) and imports its configuration (`importConfiguration`).

Errors cross contexts through `serializeError` / `deserializeError`, so they keep their data.

## 6. Settings and storage

### Settings

- The schema is `src/utils/settings-schema.ts`: **the single source of truth** for type,
  default, validation and the page dataset mirror of each setting. It has no extension API
  dependency, so page-world scripts import it too.
- Adding a setting: add one entry to `SETTINGS` (`bool`, `oneOf`, `text`, `listOf`), its
  translations in every locale, the UI in `screens/options/`, and the feature code. Missing keys
  are filled with defaults by `sanitizeSettings()`, so a new key needs no migration.
- `settingsService` (`services/settings-service.ts`) wraps a synced store (`local:settings`
  version 9, mirrored in `sync:settings` version 19). Keep versions moving forward and add
  a migration when a stored shape changes (see `migrateDefaultDarkMode`).
- Page scripts read the mirror with `readDatasetSetting` / `readDatasetSettings`
  (`utils/settings-schema.ts`). Only settings with a `dataset` name are mirrored.

### Other stores (all in `services/`)

| Data | Store | Notes |
| ---- | ----- | ----- |
| Settings | `settings-service.ts` | Local + synced, see above |
| Odoo.sh favorites (`starredProjects`) | `favorites-service.ts` | Local + synced, ordered by `sequence` |
| DevTools quick domains (`quickDomains`) | `quick-domains-service.ts` | Local + synced, seeded by `sync.init` |
| DevTools history (`devtools_history`) | `history-service.ts` | Local only, max 150 entries, pinned entries always kept |
| Hosts detected as Odoo (`odooHosts`) | `debug-mode-rules-service.ts` | Local only, max 200 hosts, newest first |

Helpers: `createStore` (local), `createSyncedStore` (local mirrored to `sync:`), and the
`bySequence` / `resequence` ordering helpers, all in `services/synced-store.ts`.

### Sync

- Background alarm `persist-local-data` (every minute) copies local data to `sync:`.
- On startup and on a new install, `configurationService.alignLocalDataWithSyncedData()`
  replaces the local data with the synced data, **unless** the sync storage is empty. Local
  edits made while the browser is offline or not signed in can be overwritten by that path.
- On an update, the local data (just migrated) is kept and persisted to `sync:` instead.

## 7. Feature map

| Surface | Feature | Code |
| ------- | ------- | ---- |
| Odoo pages | Debug mode (default, toggle, ignored paths) | `page-features/debug-mode.ts`, `utils/debug-mode-url.ts`, background rules |
| Odoo pages | Login buttons (demo users, Odoo.sh) | `page-features/login-buttons.ts`, `login-form.ts`, `odoosh-login.ts` |
| Odoo pages | Runbot auto-login (admin, demo, portal) | `page-features/runbot-login.ts` |
| Odoo pages | Default color scheme | `page-features/default-color-scheme.ts` |
| Odoo pages | Technical model name (17.0+) | `page-features/technical-model-name.ts` |
| Odoo pages | Technical print options PDF/HTML (15+) | `page-features/technical-report/` |
| Odoo pages | Technical sidebar (fields, buttons, record and view info) | `page-features/technical-list/`, `screens/technical-list/` |
| Odoo pages | Debug-mode and color-scheme settings on the page | `global.content`, `utils/settings-schema.ts` |
| Odoo.sh | Project list favorites, rename project page, branch name copy, task links, colorblind mode, full log download | `page-features/odoo-sh/`, `entries/odoosh.content/` |
| Any tab | Popup (projects, debug toggle), command palette | `screens/popup/`, `components/ui/command-palette.tsx` |
| Any tab | DevTools panel: search, write, create, call method, unlink, history, domain editor | `screens/devtools/` |
| Options | Settings, appearance (themes, text size, motion), favorites, backup/import, technical list options | `screens/options/` |
| Install/update | Update page with the changelog | `entries/update`, `screens/update`, `services/updates-changelog.ts` |
| Context menu | Disable debug mode per domain or path | `entries/background/context-menu.ts` |

## 8. Debug mode

Debug mode is the feature with the most moving parts. The default is `enableDebugMode`
(`disabled`, `1`, `assets`, `assets,tests`). It is applied in three layers, from the earliest:

1. **Network rules** (`services/debug-mode-rules-service.ts` + `utils/debug-mode-rules.ts`):
   for each host already learned as Odoo, two dynamic `declarativeNetRequest` rules redirect
   backend GET navigations (`/odoo`, `/web`, login) to the same URL with `debug=<mode>` added.
   Service-worker requests (`xmlhttprequest`, `other`) are redirected only on `/odoo` and
   `/web` entry points, so the web client's own calls are not touched. Allow rules (priority
   2) skip URLs already carrying `debug=` and the ignored paths. Rules are rebuilt when the
   settings or the host list change. Chrome caps the rules, hence the 200-host limit.
2. **Reload fallback** (`entries/background/index.ts`, `webNavigation.onCommitted`): for a
   backend page whose host is not yet learned, the background reads `window.odoo.debug` in the
   page world, learns the host (`rememberHost`), and navigates to the debug URL when needed.
   It is skipped on Runbot builds when Runbot auto-login is on (the page script applies the mode
   after login).
3. **Page script** (`page-features/debug-mode.ts`, from `odoo-websites.js`): the same check
   runs when the page loads. It reloads only if the URL still needs the mode.

Rules that matter when you change this code:

- `getDebugModeUrl()` returns `null` when no change is needed: not a backend path, an ignored
  path, the URL already has the mode, or the session already renders in that mode.
- Ignored paths (`settings.ignoredDebugPaths`) have scopes `domain`, `path`, `domain_path`.
  The default `/thanks/trial` path cannot be deleted.
- The toggle (`toggleDebugMode`, shortcut and popup) switches between `disabled` and `"1"`:
  it does not restore `assets` or `assets,tests`.
- Context-menu actions (`entries/background/context-menu.ts`) add ignored paths for a domain,
  a path or both.

## 9. Themes and UI

Read `src/theme/README.md` before touching any style. Summary:

- Five UI themes (`classic` default, `odoo-native`, `access`, `console`, `toybox`), each with light and
  dark variants. Components use only the shared token contract and DaisyUI classes.
- Hardcoded hex colors, font families, font sizes (`text-[11px]`), line heights and radii
  are forbidden in components: `src/theme/no-hardcoded-styles.test.ts` fails on them.
- Every surface root calls `useExtensionTheme()` (or `applyTheme` for the technical list).
- Reuse the shared primitives (`ToolButton`, `Tabs`, `Modal`, `Chip`, `Panel`, `StatusDot`...)
  instead of rebuilding them with utilities. Accessibility behaviour (focus, keyboard,
  announcements) lives in those components.
- `src/theme/ROADMAP.md` lists the accessibility and command palette work still open.

## 10. Odoo versions and host detection

- Versions are parsed from `server_version_info` (`utils/odoo-page.ts`, `getOdooVersion`).
  Odoo 14 and below are not supported by the UI observer (`observeOdooUi` in `odoo-websites.ts`
  does nothing for them); the other page features still run, so check each one's own version gate.
- Breakpoints in the code: print options 15+, technical model names 17.0+, new `/odoo/...`
  URLs 17.2+ (`hasNewOdooURL`), Odoo 19+ does not expose the user singleton (`getOdooContextFromWindow`
  asks the server instead).
- Odoo.sh detection (`utils/odoo-hosts.ts`, `isOdooShHosted`): the page is fetched and its
  `Server: Odoo.sh` header is read. Local, Runbot and `localhost` hosts are excluded.
- Runbot hosts: frontend `runbot*.odoo.com`, build `<build>.runbot*.odoo.com`.

## 11. Translations

- Source of truth: `src/locales/en.yml`. Other locales follow the same keys and nesting.
- Two helpers: `t()` from `services/i18n-service.ts` in extension pages (it loads messages from
  the background on demand), and `t()` from `utils/i18n-page.ts` in page-world scripts (the
  translations are injected into the page).
- Adding a locale: see the root `README.md` ("Translations"). `src/locales/locales.test.ts`
  and `services/i18n-locales.test.ts` check the files.
- Every new key must exist in every locale file, with the same placeholders (`$1`, `{model}`).

## 12. Tests

- `bun test` runs every `*.test.ts(x)` file. `bunfig.toml` preloads `tests/setup.ts`, which
  sets up happy-dom and mocks `wxt/utils/storage` with an in-memory store that replays
  `defineItem` options (`version`, `migrations`, `init`). A test can call `resetStorage()`.
- Tests sit next to their code. Prefer pure helpers (`utils/`, `screens/*/**.ts`) for logic.
- Notable suites: `src/theme/*.test.ts` (theme contract, no hardcoded styles),
  `services/settings-service.test.ts` (migrations), `utils/debug-mode-rules.test.ts` and
  `utils/debug-mode-url.test.ts` (debug mode), `page-features/*.test.ts`.
- `tests/page-world-imports.test.ts` checks which modules the page-world bundles may import.

## 13. Conventions and gotchas

- Write only the comments the code cannot say itself: the why, a constraint, a browser or Odoo
  quirk. Do not restate what the code does, and do not leave commented-out code.
- Keep to the essentials: no speculative options, helpers or abstractions for a single caller.
- Keep the code readable: small functions with one job, explicit data flow, no tangled
  control flow or hidden shared state between modules. If a change makes a function hard to
  follow, split it or simplify it before going on.
- Keep the page-world bundles small and self-contained. Do not import Solid or the extension
  services into `odoo-websites.ts` or `odoo-page-runtime.ts`; use `utils/` and `schema` modules.
- Every page feature must be idempotent: the MutationObserver and the SPA navigation call the
  same handlers many times. Mark what you have already enhanced (see the existing features).
- Odoo.sh features are re-run on each SPA route change (`ODOOSH_ROUTE_CHANGED`). Dispose what
  you start, and guard against races (`navigationId` in `odoosh.content/index.ts`).
- Do not hardcode Odoo DOM assumptions without a version check. Odoo's markup changes between
  versions: prefer `data-*`, `name` attributes and `o_` classes that already appear in the code.
- Do not edit `src/utils/odoo-py_js/` (LGPLv3, unmodified copy of Odoo).
- Use Chrome i18n locale codes (`pt_BR`, not `pt`).
- Use `browser.*` (WXT global) rather than `chrome.*`, so the code runs on both targets.
- For Firefox, `declarativeNetRequest` may be missing: the code checks `browser.declarativeNetRequest`
  and falls back to the reload path.

## 14. Surface READMEs

| Surface | README |
| ------- | ------ |
| UI themes and tokens | [`src/theme/README.md`](src/theme/README.md) (roadmap: [`src/theme/ROADMAP.md`](src/theme/ROADMAP.md)) |
| Background service worker (listeners, alarms, network rules, messages) | [`src/entries/background/README.md`](src/entries/background/README.md) |
| In-page features on Odoo pages | [`src/page-features/README.md`](src/page-features/README.md) |
| DevTools panel | [`src/screens/devtools/README.md`](src/screens/devtools/README.md) |
| Technical sidebar | [`src/screens/technical-list/README.md`](src/screens/technical-list/README.md) |
| Bundled Odoo code (LGPLv3) | [`src/utils/odoo-py_js/README.md`](src/utils/odoo-py_js/README.md) |
| Onchange research notes | [`docs/onchange-mechanism.md`](docs/onchange-mechanism.md) |

## 15. Commit messages

Follow Odoo's git guidelines (https://www.odoo.com/documentation/20.0/contributing/development/git_guidelines.html),
adapted to this repository, which has no Odoo modules.

Structure:

```
[TAG] area: short sentence describing the change

Long description: why the change is needed, then the technical choices if any.

Fixes #123
```

- **Tag**, one of:
  - `[FIX]` bug fix (also valid for a recent bug on the development branch);
  - `[REF]` refactoring, when a feature is heavily rewritten;
  - `[ADD]` new feature or new module-sized piece;
  - `[REM]` removal of dead code, views, or features;
  - `[REV]` revert of a commit that causes issues or is no longer wanted;
  - `[MOV]` moving files (use `git mv`, do not change the content of the moved file);
  - `[IMP]` incremental improvement that fits no other tag (most development changes);
  - `[MERGE]` merge commit, or the main commit of a feature spread over several commits;
  - `[I18N]` changes to translation files only;
  - `[PERF]` performance changes;
  - `[CLN]` code cleanup;
  - `[LINT]` lint and format passes;
  - `[UPG]` dependency or tooling upgrade;
  - `[DOC]` documentation only.
- **Area**: the part of the extension touched (for example `devtools`, `background`,
  `theme`, `page-features`, `odoo-sh`, `options`), in technical rather than marketing words.
  Use `various` when the change crosses areas, but prefer splitting it.
- **Header**: about 50 characters, no vague word (`bugfix`, `improvements`, `updates`), and it
  must read as a sentence after "if applied, this commit will": `[IMP] background: keep debug
  mode rules in sync with learned hosts`.
- **Body**: explain why the change is made first. Explain the technical choices only when a
  decision was taken, and why. The diff already shows what changed. Write enough for someone
  reading the commit years later.
- **Reference lines** at the end: `Fixes #123` (closes an issue), `Closes #123` (closes a pull request).
- **Scope of a commit**: one area per commit, so that one area can be reverted on its own.
  Do not bundle unrelated changes.
- Write in English, the language of the code and of the existing history.

