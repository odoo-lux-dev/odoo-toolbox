---
sidebar_position: 1
title: Getting Started
---

# Getting Started

**Odoo Toolbox** aims to improve the experience of Odoo and Odoo.SH users and developers by adding a variety of tools and features.

## Installation {#installation}

### Chromium {#chromium}

1. Visit the [Chrome Web Store](https://chromewebstore.google.com/detail/odoo-toolbox/jgobnmpfeomiffhbedhfgbhelcnnelkd)
2. Click **Add to Chrome**
3. Confirm by clicking **Add extension**

### Firefox {#firefox}

1. Visit the [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/odoo-toolbox/) page
2. Click **Add to Firefox**
3. Confirm by clicking **Add**

Once installed, the Odoo Toolbox icon will appear in your browser toolbar.

---

## Quick start {#quick-start}

### 1. Navigate to an Odoo instance {#navigate-to-odoo}

Open your browser and go to any Odoo instance running **version 14 or higher**.

### 2. Open the Popup {#open-the-popup}

Click the **Odoo Toolbox** icon in your browser toolbar to open the popup. From here you can:

- Toggle **debug mode** on or off (also available via keyboard shortcut)
- Switch the extension **theme** between light and dark
- Access your **Odoo.SH project favorites**
- Open the **Options page** for advanced settings

### 3. Inspect fields with the Technical Sidebar {#inspect-fields}

On any Odoo view, a **floating button** appears at the bottom-right corner (by default) of the page.

1. Click the button to open the **Technical Sidebar**
2. Browse the technical information about the current page (model, fields, view, etc.)
3. For more precision, enable **element selector mode** by clicking the cursor icon in the top right
4. Click any field on the page to reveal its technical details:
    - Field name (`name`, `partner_id`, ...)
    - Field type (`Many2one`, `Char`, `Selection`, ...)
    - Additional properties and metadata

### 4. Use the DevTools Panel {#use-devtools-panel}

The DevTools Panel lets you interact with the Odoo RPC layer without leaving your browser.

1. Open your browser **DevTools** (`F12` or `Ctrl+Shift+I` / `Cmd+Option+I` on Mac)
2. Navigate to the **Odoo Toolbox** tab
3. Select an operation tab:
    - **Search** - query records with domain filters and field selection
    - **Write / Create / Unlink** - modify records with JSON input
    - **Call Method** - execute any model method

---

## What's Next? {#whats-next}

Explore the documentation for each section:

- [Odoo](./odoo/overview) - Contains all tools related to Odoo databases in general
- [Odoo.SH](./odoosh/overview) - Contains all tools related to Odoo.SH
- [Options](./options) - Quick overview of the Options page for extension configuration
