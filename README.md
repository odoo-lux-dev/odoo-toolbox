<h1 align="center">
    <img src="src/assets/readme-header.png"/>
  <div>
    <a style="text-decoration: none;" href="https://chromewebstore.google.com/detail/odoo-toolbox/jgobnmpfeomiffhbedhfgbhelcnnelkd">
      <img alt="Chrome Web Store Version" src="https://img.shields.io/chrome-web-store/v/jgobnmpfeomiffhbedhfgbhelcnnelkd?style=flat-square&label=Version&logo=chromewebstore&logoColor=white&color=%233871e1"/>
    </a>    
    <a style="text-decoration: none;" href="https://chromewebstore.google.com/detail/odoo-toolbox/jgobnmpfeomiffhbedhfgbhelcnnelkd">
      <img alt="Chrome Web Store Users" src="https://img.shields.io/chrome-web-store/users/jgobnmpfeomiffhbedhfgbhelcnnelkd?style=flat-square&label=Users&logo=chromewebstore&logoColor=white&color=%233871e1"/>
    </a>         
    <a style="text-decoration: none;" href="https://chromewebstore.google.com/detail/odoo-toolbox/jgobnmpfeomiffhbedhfgbhelcnnelkd">
      <img alt="Chrome Web Store Rating" src="https://img.shields.io/chrome-web-store/rating/jgobnmpfeomiffhbedhfgbhelcnnelkd?style=flat-square&logo=chromewebstore&logoColor=white&label=Rating&color=%233871e1"/>
    </a>
    <a style="text-decoration: none;" href="https://chromewebstore.google.com/detail/odoo-toolbox/jgobnmpfeomiffhbedhfgbhelcnnelkd">
      <img alt="Chrome Web Store Size" src="https://img.shields.io/chrome-web-store/size/jgobnmpfeomiffhbedhfgbhelcnnelkd?style=flat-square&logo=chromewebstore&logoColor=white&label=Size&color=%233871e1"/>
    </a>  
  </div>
  <div>
    <a style="text-decoration: none;" href="https://addons.mozilla.org/en-US/firefox/addon/odoo-toolbox">
      <img alt="Mozilla Add-on Version" src="https://img.shields.io/amo/v/odoo-toolbox?style=flat-square&logo=firefoxbrowser&logoColor=white&label=Version&color=%23ed6449"/>
    </a>    
    <a style="text-decoration: none;" href="https://addons.mozilla.org/en-US/firefox/addon/odoo-toolbox">
      <img alt="Mozilla Add-on Users" src="https://img.shields.io/amo/users/odoo-toolbox?style=flat-square&logo=firefoxbrowser&logoColor=white&label=Users&color=%23ed6449"/>
    </a>    
    <a style="text-decoration: none;" href="https://addons.mozilla.org/en-US/firefox/addon/odoo-toolbox">
      <img alt="Mozilla Add-on Rating" src="https://img.shields.io/amo/rating/odoo-toolbox?style=flat-square&logo=firefoxbrowser&logoColor=white&label=Rating&color=%23ed6449"/>
    </a>
  </div>
</h1>

This extension aims to enhance the experience of Odoo developers and Odoo.SH users by adding a variety of tools and features.

# Installation
- Install it from [Chrome Web Store](https://chromewebstore.google.com/detail/odoo-toolbox/jgobnmpfeomiffhbedhfgbhelcnnelkd)
- Install it from [Firefox Browser Add-ons](https://addons.mozilla.org/en-US/firefox/addon/odoo-toolbox/)
- Install it [from sources](#local-development)

# Non exhaustive functionnalities

* __Advanced DevTools panel for Odoo RPC testing and data exploration__
* __Technical sidebar with field inspection and database context information__
* __Star project on odoo SH, order the favorites list and ability to rename them__
* __Enable (or not) debug mode by default on Odoo websites__
* __Toggle debug mode from the extension's popup__
* __Show technical printing options (PDF/HTML)__
* __Show technical model name on record from Odoo v17.2 and above__
* __Rename tab's title of Odoo.sh project to includes current project's name__
* __Add task links to branch names with custom URL patterns and regex support__
* __Copy branch name with a single click on Odoo.sh__
* __Enable colorblind mode for better accessibility on Odoo.sh build statuses__
* __Toggle between light and dark themes for the extension interface__
* __Nostalgia mode with retro monkey icons for debug toggles__
* __Default dark mode setting for Odoo interfaces__
* __Export and import extension configuration for easy sharing or backup__
* __Quick access to GitHub repositories from branch pages__

<br>

---

<br>

# Local development

## Installation
This requires Bun [Installation guide](https://bun.sh/docs/installation)

Once Bun is installed, you can install the extension by running the following command in your terminal:
```bash
bun install
```

## Development
To start developing the extension, you can run the following command in your terminal:
```bash
bun dev
```

This will start a development server that will watch for changes in the source code and automatically reload the extension in your browser.

## Build
To build the extension, you can run the following commands in your terminal:
```bash
bun build
bun build:firefox
```

This will create a `dist` folder containing the built production-ready extension that you can then load into your browser.

## Zip
To create a zip file containing the built extension, you can run the following commands in your terminal:
```bash
bun zip
bun zip:firefox
```

This will create a zip file in the `dist` folder.

<br>

---
<br>

# Use of Odoo Code in this project

This project includes code sourced from the [Odoo](https://github.com/odoo/odoo) open source project, specifically from the [`src/utils/odoo-py_js`](./src/utils/odoo-py_js) directory.

- The included Odoo code is distributed under the [GNU Lesser General Public License version 3 (LGPLv3)](https://www.gnu.org/licenses/lgpl-3.0.html).
- The code has been incorporated without modification and is used as a utility module within this extension.
- For full details, license texts, and original sources, please refer to:
  - The LICENSE file contained in `src/utils/odoo-py_js`
  - The official Odoo repository: https://github.com/odoo/odoo/tree/f0b80bd634c4a907a4df7d06d318572ccdeb2fca/addons/web/static/src/core/py_js

By including this code, this project complies with LGPLv3 license requirements concerning attribution and usage.

<br>

---
<br>

# Extension Permissions

This extension requests the following permissions to provide its functionality:

## Required Permissions

| Permission | Purpose | Justification |
|------------|---------|---------------|
| **`storage`** | Store user preferences and configuration | Save extension settings, Odoo.SH favorites, debug mode preferences, and DevTools history across browser sessions |
| **`tabs`** | Access tab information | Read current tab URL to detect Odoo websites and apply extension features only on relevant pages |
| **`alarms`** | Schedule background tasks | Manage data persistence and cleanup operations for stored favorites and history |
| **`scripting`** | Execute scripts on web pages | Inject content scripts into Odoo pages to enable DevTools RPC communication, debug mode toggle, and technical features |
| **`clipboardWrite`** | Copy data to clipboard | Allow users to copy technical information (field values, branch names, etc.) with one-click actions |

## Host Permissions

| Permission | Purpose | Justification |
|------------|---------|---------------|
| **`*://*/*` (All websites)** | Access all websites | Automatically detect Odoo installations across any domain (including custom domains, localhost, Odoo.SH subdomains) and apply relevant features |

## Web Accessible Resources

| Resource | Purpose |
|----------|---------|
| **`odoo-websites.js`** | Shared utilities for Odoo page detection and interaction |

## Privacy & Security

- **No data collection**: The extension does not collect, transmit, or store any personal data externally
- **Local storage only**: All settings and favorites are stored locally in your browser
- **Odoo-specific**: Features are only activated on detected Odoo websites
- **No external requests**: The extension only communicates with the current Odoo instance you're viewing
- **Open source**: All code is publicly available for review on GitHub

<br>

---

<br>

# Testimonials


<blockquote>
  <em>"The best chrome extension you'll ever see..."</em><br>
  — SAJU - Odoo Client Solution Developer
</blockquote>

<br>

<blockquote>
  <em>"Dinguerie quand même cette extension, tu veux pas la partager au PS-Tech en Belgique?"</em><br>
  — MAVI - Lux PS tech coach, author of the famous "Saaaaaaalut"
</blockquote>
<br>

<blockquote>
  <em>"I think I am in love"</em><br>
  — PAL - Lux PS tech leader, 2023 Karting champion, author of the famous "Euuuuh, l'ambiance"
</blockquote>
<br>
