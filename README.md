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

# Project Structure

The extension is built using WXT ([Docs](https://wxt.dev/)) and follows a modular architecture:

### `/src/components`
Reusable UI components:
- `/icons` - SVG icons used throughout the extension
- `/options` - Components specific to the options page
- `/popup` - Components for the popup interface
- Common UI elements like tooltips and toggles

### `/src/entries`
Entry points for the extension's different components:
- `/background` - Background script for handling alarms. Used for persisting configuration
- `/popup` - The extension's popup interface for quick access to favorites and debug toggle
- `/options` - The extension's settings page with all configuration options
- `/odoosh.content` - Content scripts specifically for Odoo.sh pages
- `/global.content` - Content scripts applied to all Odoo pages
- `/odoo-websites.js` - Script for enhancing Odoo websites functionality

### `/src/features`
Core functionality modules:
- `/debug-mode.ts` - Manages debug mode functionality
- `/technical-report.ts` - Handles technical printing options in Odoo reports
- `/technical-model-name.ts` - Adds technical model names to Odoo views
- `/default-dark-mode.ts` - Controls dark mode settings for Odoo interfaces
- `/odoo-sh` - Features specifically for Odoo.sh

### `/src/hooks`
Custom React hooks for reusable logic:
- `use-themed-icons.tsx` - Hook to manage icons based on theme and nostalgia mode

### `/src/utils`
Utility functions and shared resources:
- `/storage.ts` - Extension storage management with migrations system
- `/constants.ts` - Application-wide constants
- `/types.ts` - TypeScript type definitions
- `/utils.ts` - Shared utility functions
- `/logger.ts` - Logging utilities
- `/regex.ts` - Regular expressions for parsing branch names and tasks

### `/src/theme`
UI theming components:
- Dark/light theme implementation
- Variables and styling utilities for consistent UI

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

## Release / Zip
To create a zip file containing the built extension, you can run the following commands in your terminal:
```bash
bun zip
bun zip:firefox
```

This will create a zip file in the `dist` folder that you can then upload to the Chrome Web Store or Firefox Add-ons.

To upload you can use the following commands:
```bash
bun wxt submit \
    --chrome-zip dist/*-chrome.zip \
    --firefox-zip dist/*-firefox.zip --firefox-sources-zip .output/*-sources.zip
```

Get more details here [WXT Publishing Guide](https://wxt.dev/guide/essentials/publishing.html)

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
