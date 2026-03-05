---
sidebar_position: 2
title: DevTools Panel
toc_max_heading_level: 4
---

# DevTools Panel

:::danger Use with caution
Most operations available in this panel (**Create**, **Update**, **Delete**, **Call Method**) write directly to the database and are **irreversible**. Only the **Search** operation is safe as it is read-only.

- Never run write or delete operations on a production database unless you are certain of what you are doing.
- When in doubt, always test on a **test database** first.
  :::

The DevTools Panel is a full RPC testing interface embedded directly in your browser's developer tools. It lets you query, create, update, delete and call methods on any Odoo model without leaving your browser.

## Opening the panel {#opening-the-panel}

1. Open your browser's DevTools (<kbd>F12</kbd> or <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>I</kbd> / <kbd>Cmd</kbd>+<kbd>Option</kbd>+<kbd>I</kbd> on macOS).
2. Look for the **Odoo Toolbox** tab in the DevTools tab bar.
3. Click it - the panel opens and automatically connects to the current Odoo page.

:::info
If an error message appears, make sure you are on an Odoo page and connected to the backend (not the website).
:::

![DevTools Panel - overview](/img/devtools-panel/overview.png)

## The interface {#the-interface}

The panel is divided into two main areas:

- **Left / top - Query builder**: where you configure the model, operation, domain, fields and payload.
- **Right / bottom - Response viewer**: where the JSON response is displayed after execution.

![DevTools Panel - interface overview](/img/devtools-panel/interface-overview.png)

### Sidebar {#sidebar}

The sidebar on the left contains the input fields used to build your query. The fields displayed change depending on the selected operation (Search, Create, Update, Delete, Call Method). All possible fields are shown in the **Search** tab; other operations only show the relevant fields.

:::info
Even when on a tab other than Search, you can fill in the sidebar fields to run a new search. Useful if you want to change the set of records targeted by your next action.
:::

#### Model {#model}

The **Model** field expects a technical model name (e.g. `res.partner`, `sale.order`). It supports auto-completion to help you find the right model.

#### IDs {#ids}

The **Record IDs** field expects a JSON array of record IDs (e.g. `[1, 2, 3]`) or a comma-separated list (e.g. `1,2,3`). It is used to target specific records in update, delete or call method operations.

#### Field selection {#field-selection}

The **Fields** input has a search and a list of available fields for the model. Limiting the fields you fetch makes the response easier to read and the call faster.

Leave the input empty to return every field on the model.

#### Domain filters {#domain-filters}

Domains follow the standard [Odoo domain syntax](https://www.odoo.com/documentation/master/developer/reference/backend/orm.html#domains): a JSON array of conditions combined with `&` (AND, default) and `|` (OR) prefix operators.

```json
[
    ["state", "=", "done"],
    ["partner_id.country_id.code", "=", "US"]
]
```

The panel validates the domain as JSON in real time and highlights syntax errors before you even run the query.

:::tip
Use an empty array `[]` to match all records (equivalent to no filter).
:::

#### Sorting and pagination {#sorting-and-pagination}

The **Order By** field lets you specify the sort order of results (e.g. `name ASC` or `create_date DESC`). It has a search and a list of available fields for the model.

The **Limit** field caps the number of records returned, and **Offset** skips a number of records (for pagination).

#### Execute button {#execute-button}

Once your query is configured, click **Execute Query** to run it. The response appears in the right-hand area.

#### Get Current button {#get-current-button}

The **Get Current** button pre-fills the sidebar fields with values from the current Odoo view. For example, if you are on a partner form, it will fill **Model** with `res.partner` and **Record IDs** with the ID of the displayed record. If you have multiple records selected in a list view, it will fill **Record IDs** with all of their IDs.

### Response viewer {#response-viewer}

After running a call, the record(s) matching the defined criteria are displayed in the response area.

- A **Copy** button lets you copy the full response to your clipboard. **Download** lets you save it as a JSON file.
- Errors returned by Odoo (e.g. access rights, missing fields) are displayed with their message and traceback.

#### Display options {#display-options}

The response defaults to list view. In the **Search** tab, you can also switch to table view using the toggle button in the top right.

#### Record action buttons {#record-action-buttons}

In list view, each record has quick action buttons to focus it, open it in Odoo, or open it as a popup.

| Icon                                         | Action                                                                                                                                                 |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ![Focus](/img/devtools-panel/focus-icon.png) | Focuses the record in DevTools - useful as a starting point for further operations (update, delete, call method) on that specific record.              |
| ![Open](/img/devtools-panel/open-icon.png)   | Opens the record in Odoo (replaces the content of the parent window).                                                                                  |
| ![Popup](/img/devtools-panel/popup-icon.png) | Opens the record in an Odoo popup - useful to quickly inspect a record's details without losing the context of your current work in the parent window. |

## Operations {#operations}

Use the top menu to choose what you want to do. Each operation shows only the sidebar fields relevant to it.

### Search {#search}

The most common operation and the default one. Returns a list of records matching the given criteria (domain, model, …).

:::note Sidebar fields
`Model` · `Record IDs` · `Fields` · `Domain` · `Order By` · `Limit` · `Offset` · `Context`
:::

![DevTools Panel - Search](/img/devtools-panel/search.png)

### Write {#write}

Updates existing records matching the given criteria.

:::danger
This operation modifies existing records in the database. Make sure the IDs you provide match the records you intend to update, and that the values are correct. If unsure, test on a test database first.
:::

:::note Sidebar fields
`Model` · `Record IDs` · `Domain` · `Context`
:::

![DevTools Panel - Update](/img/devtools-panel/write.png)

### Create {#create}

Creates a record with the given values and displays it once created.

:::danger
This operation creates new records in the database. Make sure the values you provide are correct, and that you are on a test database if you are not certain.
:::

:::note Sidebar fields
`Model` · `Context`
:::

![DevTools Panel - Create](/img/devtools-panel/create.png)

### Call Method {#call-method}

Calls any public method on a model. Useful for triggering business logic, wizards or custom methods.

:::note Sidebar fields
`Model` · `Record IDs` · `Domain` · `Context`
:::

![DevTools Panel - Call Method](/img/devtools-panel/call-method.png)

### Delete & Archive {#unlink}

Archives, unarchives or permanently deletes the matching records.

:::danger
This operation modifies or permanently deletes existing records in the database. Make sure the IDs you provide match the records you intend to modify or delete. If unsure, test on a test database first.
:::

:::note Sidebar fields
`Model` · `Record IDs` · `Domain` · `Context`
:::

![DevTools Panel - Delete & Archive](/img/devtools-panel/unlink.png)

## Request History {#request-history}

The panel keeps a history of your recent queries (up to 150), accessible via the **History** tab in the top menu. You can browse each request's details (model, domain, payload, response) and easily re-run or copy them.

![DevTools Panel - History tab](/img/devtools-panel/history-tab.png)
