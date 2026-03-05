---
sidebar_position: 3
title: Additional Features
---

# Additional Features

This page covers the small utilities that Odoo Toolbox adds to the Odoo.SH interface to make your daily project and branch management easier. These features are available directly on [Odoo.SH](https://www.odoo.sh), with no configuration required.

## Branch shortcuts {#branch-shortcuts}

![Branch shortcuts](/img/odoosh/additional-features/shortcuts.png)

### Branch name copy {#branch-name-copy}

Each branch row on an Odoo.SH project page has a **copy icon** next to the branch name. Click it to instantly copy the branch name to your clipboard - handy for `git checkout` commands, commit messages, or task names.

<!-- ![Branch name copy](/img/odoosh/additional-features/branch-copy.png) -->

### GitHub links {#github-links}

Odoo Toolbox adds a direct **GitHub link** on each branch, pointing to the corresponding branch in your GitHub repository. No more navigating to GitHub separately and searching for the right branch.

<!-- ![GitHub links](/img/odoosh/additional-features/github-links.png) -->

### Task integration {#task-integration}

Odoo Toolbox can associate an Odoo.SH branch with a task in your Odoo project. When a match is detected in the branch name, a direct link to the task is displayed next to the branch.

#### How it works

The extension analyzes each branch name using the regular expression `/-(\d+)-/`. The captured numeric ID is then injected into a customizable URL via the `{{task_id}}` placeholder. Both the regex and the URL can be customized from the extension options.

The default pattern matches the format: `VERSION-TASKID-OPTIONAL_DESCRIPTION`

Examples of recognized branch names: `17.0-12345-my-feature`, `15.0-6789-fixes`

To configure the target URL, go to the **extension options** and set the URL with the `{{task_id}}` placeholder. For example:

```
https://my-odoo.com/odoo/project/task/{{task_id}}
```

:::tip
You can set a specific URL per favorite from the **SH Favorites** page in the extension options.
:::

## Colorblind-friendly build status {#colorblind-build-status}

By default, Odoo.SH uses color alone to convey build statuses (green, red, orange). Odoo Toolbox enhances these indicators with distinct icons and shapes, making statuses readable even without color distinction.

| Status      | Visual indicator                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Success     | <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#28a745" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>                                                                                                                                                                                                                          |
| Failed      | <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc3545" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>                                                                                                                                                                                                         |
| In progress | <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 12-8.373 8.373a1 1 0 1 1-3-3L12 9"/><path d="m18 15 4-4"/><path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5"/></svg> |
| Waiting     | <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 2 20 20"/><path d="M8.35 2.69A10 10 0 0 1 21.3 15.65"/><path d="M19.08 19.08A10 10 0 1 1 4.92 4.92"/></svg>                                                                                                                               |

<!-- ![Colorblind-friendly build status](/img/odoosh/additional-features/colorblind-status.png) -->

:::tip
This feature is especially useful when using Odoo.SH on a poorly calibrated monitor or in an environment with strong ambient lighting.
:::
