# In-page features

Features that change Odoo pages. They run in the page itself, so they see `window.odoo` and the
DOM, but they have no extension API. Read [`AGENTS.md`](../../AGENTS.md) sections 4 and 7 first.

## How they run

| Entry                                                                                                     | World    | Features                                                                                                                                                            |
| --------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `entries/odoo-websites.ts` (`odoo-websites.js`, injected by `global.content` on every `*://*/*` page)     | MAIN     | Version check, technical model names, print options, login buttons, Odoo.sh login button, Runbot auto-login, debug mode, default color scheme, home menu background |
| `entries/odoo-technical-list.ts` (`odoo-technical-list.js`, injected only when `showTechnicalList` is on) | MAIN     | Technical sidebar, see [`screens/technical-list/README.md`](../screens/technical-list/README.md)                                                                    |
| `entries/odoosh.content/index.ts` (matches `*.odoo.sh/project*` and `/paas/*`)                            | ISOLATED | Odoo.sh features in `page-features/odoo-sh/`                                                                                                                        |

Settings reach the page scripts through `document.body.dataset`: the global content script
writes them (`writeSettingsDataset`), and the page reads them with `readDatasetSetting(s)`
from `utils/settings-schema.ts`. A setting read on the page must have a `dataset` name in the
schema.

## Features

| Folder or file                      | Feature                                                                                                                                                                                                                     |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `debug-mode.ts`                     | Forces the configured debug mode when the page is loaded without it (`setDebugMode`). `getConfiguredDebugModeUrl` is reused by Runbot auto-login                                                                            |
| `default-color-scheme.ts`           | Applies the default light/dark scheme of Odoo pages                                                                                                                                                                         |
| `home-menu-background.ts`           | Hides the custom home menu background of Odoo Enterprise (`hideHomeMenuBackground`): removes the body class, the inline image is overridden in `global.content/global-style.scss`                                           |
| `login-buttons.ts`, `login-form.ts` | Demo user login buttons on the login form (admin, demo, portal)                                                                                                                                                             |
| `odoosh-login.ts`                   | Login button for Odoo.sh databases (only when `isOdooShHosted()`)                                                                                                                                                           |
| `runbot-login.ts`                   | Runbot auto-login: the intent is carried in the URL fragment `#x-odoo-toolbox-autologin=<user>`, because the `/runbot/run/<id>` redirect drops query parameters. The fragment is cleared after use. Reads `runbotAutoLogin` |
| `technical-model-name.ts`           | Shows the technical model name next to the model label (17.0+), also in dialogs                                                                                                                                             |
| `technical-report/`                 | Technical print options (PDF and HTML) on report actions (15.0+), with the URL and context helpers and their tests                                                                                                          |
| `technical-list/`                   | Mounts the sidebar (`initTechnicalList`)                                                                                                                                                                                    |
| `odoo-sh/`                          | Odoo.sh project list favorites, project page (branch helpers, colorblind palette, task links), rename project page, branch name copy, full log download (`handle-sh-download-full-log.ts`)                                  |

## Rules for new features

1. **Idempotent.** The MutationObserver in `odoo-websites.ts` calls every handler on every
   added node, and Odoo re-renders its views. Mark what you enhanced (a class or attribute) and
   skip it on the next call.
2. **Version-aware.** Odoo's DOM and JS API change between versions. Gate on
   `getOdooVersion()` (`utils/odoo-page.ts`) and explain the gate in a comment. Do not assume
   Odoo 14 or below.
3. **Page-world modules stay light.** `odoo-websites.ts` and `odoo-technical-list.ts` must not
   import `services/i18n-service`, `services/settings-service`, `wxt/storage` or
   `hooks/use-extension-theme`: `tests/page-world-imports.test.ts` fails on them. Use
   `utils/i18n-page` (`t`) and `readDatasetSetting` instead.
4. **Settings from the schema.** Read a setting with `readDatasetSetting` on the page, and add
   a `dataset` name to its schema entry if it is needed there.
5. **Do not hijack Odoo's behaviour silently.** A feature that navigates (`window.location`),
   reloads or submits a form must say so in its comment and must stop after one attempt (see
   `debug-mode.ts`: reload only when the URL still needs it).
6. **Odoo.sh features are SPA-aware.** Odoo.sh routes change without a page load. The
   content script re-runs the page handler on `ODOOSH_ROUTE_CHANGED`: dispose what you start,
   and drop results of a stale route (`navigationId` in `odoosh.content/index.ts`).
7. **Translations** come from `utils/i18n-page` (`t`) in page scripts, with keys in every
   `src/locales/*.yml`.

## Tests

Pure logic is tested next to the code: `debug-mode.test.ts`, `default-color-scheme.test.ts`,
`home-menu-background.test.ts`,
`runbot-login.test.ts`, `technical-report/*.test.ts`, `odoo-sh/*.test.ts`. Tests use
happy-dom and set `document.body.dataset` directly (see `debug-mode.test.ts`).
