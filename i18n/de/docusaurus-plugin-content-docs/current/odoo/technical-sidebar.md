---
sidebar_position: 3
title: Technische Seitenleiste
---

# Technische Seitenleiste

:::warning
Diese Funktion unterstützt nur Odoo-Version 16 und höher.
:::

Die Technische Seitenleiste ist ein schwebendes Inspektionspanel, das sich über jede Odoo-Seite legt. Sie ermöglicht Ihnen, Felder, deren Typen, Eigenschaften und Metadaten in Echtzeit zu inspizieren, ohne die Seite zu verlassen oder die DevTools zu öffnen.

## Die Seitenleiste aktivieren {/* #activate-the-sidebar */}

Die Seitenleiste wird über das [Erweiterungs-Popup](./popup) aktiviert: Klicken Sie auf das Erweiterungssymbol in der Symbolleiste Ihres Browsers und aktivieren Sie dann den Schalter **Technische Seitenleiste**. Sie kann auch über die [Erweiterungsoptionen](../options) aktiviert werden.

## Übersicht {/* #overview */}

Die Seitenleiste ist ein an der Seite der Seite verankertes Panel. Sie enthält:

- **Datenbankinformationen**: zeigt Informationen über die aktuelle Datenbank an, wie z.B. ihren Namen, ihre Version usw.
- **Datensatzinformationen**: zeigt Informationen über den Datensatz der aktuellen Ansicht an, wie z.B. seine ID, sein Modell usw.
- **Die Feldliste**: zeigt alle Felder des aktuellen Modells mit einigen technischen Informationen an.
- **Die Aktionsliste**: zeigt alle verfügbaren Aktionen für das aktuelle Modell mit einigen technischen Informationen an.
- **Die Suchleiste**: filtert die Feld- und Aktionsliste nach technischem Namen, Anzeige-Label oder Typ.

![Technische Seitenleiste - Oberfläche](/img/technical-sidebar/interface.png)

:::info
Der Debug-Modus muss nicht aktiviert sein, um auf die Informationen zuzugreifen.
:::

## Funktionen {/* #features */}

### Datenbankinformationen {/* #database-information */}

Informationen über die aktuelle Datenbank werden oben in der Seitenleiste angezeigt, einschließlich:

- Der Odoo-Version
- Der Datenbankname
- Der aktuellen Sprache
- Der Status des Entwicklermodus

![Technische Seitenleiste - Datenbankinformationen](/img/technical-sidebar/database-information.png)

### Datensatzinformationen {/* #record-information */}

Informationen über den Datensatz der aktuellen Ansicht werden unter den Datenbankinformationen angezeigt, einschließlich:

- Der Modellname (z.B. `res.partner`, `sale.order`)
- Der Datensatz-ID
- Der Ansichtstyp (z.B. `form`, `list`, `kanban`)
- Der Aktionstyp (z.B. `ir.actions.act_window`)
- Der Aktionsname (z.B. Partner anzeigen)
- Der Aktions-ID
- Der XML-ID der Aktion (z.B. `base.action_res_partner_form`)
- Der Aktionskontext (z.B. `{'search_default_group_by_country': 1}`)

![Technische Seitenleiste - Datensatzinformationen](/img/technical-sidebar/record-information.png)

#### Aktionsbuttons {/* #action-buttons */}

In diesem Abschnitt sind außerdem mehrere Aktionsbuttons verfügbar, um verschiedene Aktionen auszuführen:

- Modellfelder anzeigen
- Modell-Zugriffsrechte anzeigen
- Modell-Datensatzregeln anzeigen
- Verfügbare Aktionen für das Modell anzeigen
- Die mit der aktuellen Ansicht verknüpfte Aktion anzeigen
- Die Daten des aktuellen Datensatzes als JSON anzeigen

![Technische Seitenleiste - Aktionsbuttons](/img/technical-sidebar/record-actions.png)

### Feld- und Aktionsliste {/* #fields-and-actions-list */}

Die Felder und Aktionen des aktuellen Modells werden in der Seitenleiste mit einigen technischen Informationen aufgelistet. Filter und eine Suchleiste sind ebenfalls verfügbar, um schnell ein bestimmtes Feld oder eine bestimmte Aktion zu finden.

Wenn Sie mit der Maus über ein Element in der Liste fahren, wird es auf der Seite hervorgehoben, sodass Sie es visuell identifizieren können.

![Technische Seitenleiste - Hover](/img/technical-sidebar/fields-highlight.png)

### Feld- oder Aktionsdetails {/* #field-or-action-details */}

Es ist auch möglich, einen Modus zu aktivieren, der es Ihnen ermöglicht, auf ein Feld oder eine Aktion zu klicken, um dessen technische Details in der Seitenleiste anzuzeigen. Dies gibt Ihnen fokussierte Informationen über dieses spezifische Feld oder diese spezifische Aktion.

Dieser Modus wird durch Klicken auf den Inspektions-Button oben rechts in der Seitenleiste aktiviert.

![Technische Seitenleiste - Inspektionsmodus](/img/technical-sidebar/field-selected.png)
