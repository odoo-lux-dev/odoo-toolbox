---
sidebar_position: 4
title: DevTools Panel
toc_max_heading_level: 4
---

# DevTools Panel

:::danger[Mit Vorsicht verwenden]
Die meisten in diesem Panel verfügbaren Operationen (**Create**, **Update**, **Delete**, **Call Method**) schreiben direkt in die Datenbank und sind **irreversibel**. Nur die **Search**-Operation ist sicher, da sie schreibgeschützt ist.

- Führen Sie niemals Schreib- oder Löschoperationen auf einer Produktionsdatenbank aus, es sei denn, Sie sind sicher, was Sie tun.
- Im Zweifelsfall testen Sie immer zuerst auf einer **Testdatenbank**.
  :::

Das DevTools Panel ist eine vollständige RPC-Testschnittstelle, die direkt in die Entwicklertools Ihres Browsers eingebettet ist. Es ermöglicht Ihnen, Modelle abzufragen, Datensätze zu erstellen, zu aktualisieren, zu löschen und Methoden auf jedem Odoo-Modell aufzurufen, ohne Ihren Browser zu verlassen.

## Das Panel öffnen {/* #opening-the-panel */}

1. Öffnen Sie die DevTools Ihres Browsers (<kbd>F12</kbd> oder <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>I</kbd> / <kbd>Cmd</kbd>+<kbd>Option</kbd>+<kbd>I</kbd> auf macOS).
2. Suchen Sie nach dem Reiter **Odoo Toolbox** in der Reiterleiste der DevTools.
3. Klicken Sie darauf - das Panel öffnet sich und verbindet sich automatisch mit der aktuellen Odoo-Seite.

:::info
Wenn eine Fehlermeldung erscheint, stellen Sie sicher, dass Sie sich auf einer Odoo-Seite befinden und mit dem Backend verbunden sind (nicht mit der Website).
:::

![DevTools Panel - Übersicht](/img/devtools-panel/overview.png)

## Die Oberfläche {/* #the-interface */}

Das Panel ist in zwei Hauptbereiche unterteilt:

- **Links / oben - Query Builder**: Hier konfigurieren Sie Modell, Operation, Domäne, Felder und Payload.
- **Rechts / unten - Response Viewer**: Hier wird die JSON-Antwort nach der Ausführung angezeigt.

![DevTools Panel - Übersicht der Oberfläche](/img/devtools-panel/interface-overview.png)

### Seitenleiste {/* #sidebar */}

Die Seitenleiste auf der linken Seite enthält die Eingabefelder zum Erstellen Ihrer Abfrage. Die angezeigten Felder ändern sich je nach ausgewählter Operation (Search, Create, Update, Delete, Call Method). Alle möglichen Felder werden im Reiter **Search** angezeigt; andere Operationen zeigen nur die relevanten Felder.

:::info
Auch wenn Sie sich in einem anderen Reiter als Search befinden, können Sie die Seitenleistenfelder ausfüllen, um eine neue Suche auszuführen. Nützlich, wenn Sie die Datensatzmenge ändern möchten, auf die Ihre nächste Aktion abzielt.
:::

#### Model {/* #model */}

Das Feld **Model** erwartet einen technischen Modellnamen (z.B. `res.partner`, `sale.order`). Es unterstützt die Autovervollständigung, um Ihnen bei der Suche nach dem richtigen Modell zu helfen.

#### IDs {/* #ids */}

Das Feld **Record IDs** erwartet ein JSON-Array von Datensatz-IDs (z.B. `[1, 2, 3]`) oder eine kommagetrennte Liste (z.B. `1,2,3`). Es wird verwendet, um bestimmte Datensätze bei Aktualisierungs-, Lösch- oder Methodenaufruf-Operationen zu adressieren.

#### Feldauswahl {/* #field-selection */}

Das Feld **Fields** verfügt über eine Suche und eine Liste der für das Modell verfügbaren Felder. Die Einschränkung der abgerufenen Felder macht die Antwort leichter lesbar und den Aufruf schneller.

Lassen Sie das Feld leer, um alle Felder des Modells zurückzugeben.

#### Domänenfilter {/* #domain-filters */}

Domänen folgen der Standard-[Odoo-Domänensyntax](https://www.odoo.com/documentation/master/developer/reference/backend/orm.html#search-domains): ein JSON-Array von Bedingungen, kombiniert mit `&` (AND, Standard) und `|` (OR) Präfixoperatoren.

```json
[
    ["state", "=", "done"],
    ["partner_id.country_id.code", "=", "US"]
]
```

Das Panel validiert die Domäne in Echtzeit als JSON und hebt Syntaxfehler hervor, bevor Sie die Abfrage überhaupt ausführen.

:::tip
Verwenden Sie ein leeres Array `[]`, um alle Datensätze abzugleichen (entspricht keinem Filter).
:::

#### Sortierung und Paginierung {/* #sorting-and-pagination */}

Das Feld **Order By** ermöglicht Ihnen, die Sortierreihenfolge der Ergebnisse festzulegen (z.B. `name ASC` oder `create_date DESC`). Es verfügt über eine Suche und eine Liste der für das Modell verfügbaren Felder.

Das Feld **Limit** begrenzt die Anzahl der zurückgegebenen Datensätze, und **Offset** überspringt eine Anzahl von Datensätzen (für Paginierung).

#### Ausführen-Button {/* #execute-button */}

Sobald Ihre Abfrage konfiguriert ist, klicken Sie auf **Execute Query**, um sie auszuführen. Die Antwort erscheint im rechten Bereich.

#### Get Current-Button {/* #get-current-button */}

Der Button **Get Current** füllt die Seitenleistenfelder mit den Werten der aktuellen Odoo-Ansicht vor. Wenn Sie sich beispielsweise in einem Partnerformular befinden, füllt er **Model** mit `res.partner` und **Record IDs** mit der ID des angezeigten Datensatzes. Wenn Sie mehrere Datensätze in einer Listenansicht ausgewählt haben, füllt er **Record IDs** mit all deren IDs.

### Response Viewer {/* #response-viewer */}

Nach der Ausführung eines Aufrufs werden die Datensätze, die den definierten Kriterien entsprechen, im Antwortbereich angezeigt.

- Ein **Copy**-Button ermöglicht Ihnen, die vollständige Antwort in die Zwischenablage zu kopieren. **Download** ermöglicht Ihnen, sie als JSON-Datei zu speichern.
- Von Odoo zurückgegebene Fehler (z.B. Zugriffsrechte, fehlende Felder) werden mit ihrer Meldung und ihrem Traceback angezeigt.

#### Anzeigeoptionen {/* #display-options */}

Die Antwort wird standardmäßig als Listenansicht angezeigt. Im Reiter **Search** können Sie außerdem über die Umschalttaste oben rechts zur Tabellenansicht wechseln.

#### Datensatz-Aktionsbuttons {/* #record-action-buttons */}

In der Listenansicht hat jeder Datensatz Schnellaktions-Buttons, um ihn zu fokussieren, in Odoo zu öffnen oder als Popup zu öffnen.

| Symbol                                        | Aktion                                                                                                                                                            |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ![Focus](/img/devtools-panel/focus-icon.png) | Fokussiert den Datensatz in den DevTools - nützlich als Ausgangspunkt für weitere Operationen (Aktualisierung, Löschung, Methodenaufruf) auf diesem speziellen Datensatz. |
| ![Open](/img/devtools-panel/open-icon.png)   | Öffnet den Datensatz in Odoo (ersetzt den Inhalt des übergeordneten Fensters).                                                                                     |
| ![Popup](/img/devtools-panel/popup-icon.png) | Öffnet den Datensatz in einem Odoo-Popup - nützlich, um schnell die Details eines Datensatzes zu inspizieren, ohne den Kontext Ihrer aktuellen Arbeit im übergeordneten Fenster zu verlieren. |

## Operationen {/* #operations */}

Verwenden Sie das obere Menü, um auszuwählen, was Sie tun möchten. Jede Operation zeigt nur die für sie relevanten Seitenleistenfelder an.

### Search {/* #search */}

Die häufigste Operation und die Standardoperation. Gibt eine Liste von Datensätzen zurück, die den angegebenen Kriterien entsprechen (Domäne, Modell, ...).

:::note[Seitenleistenfelder]
`Model` · `Record IDs` · `Fields` · `Domain` · `Order By` · `Limit` · `Offset` · `Context`
:::

![DevTools Panel - Search](/img/devtools-panel/search.png)

### Write {/* #write */}

Aktualisiert vorhandene Datensätze, die den angegebenen Kriterien entsprechen.

:::danger
Diese Operation ändert vorhandene Datensätze in der Datenbank. Stellen Sie sicher, dass die von Ihnen angegebenen IDs mit den Datensätzen übereinstimmen, die Sie aktualisieren möchten, und dass die Werte korrekt sind. Im Zweifelsfall testen Sie zuerst auf einer Testdatenbank.
:::

:::note[Seitenleistenfelder]
`Model` · `Record IDs` · `Domain` · `Context`
:::

![DevTools Panel - Update](/img/devtools-panel/write.png)

### Create {/* #create */}

Erstellt einen Datensatz mit den angegebenen Werten und zeigt ihn nach der Erstellung an.

:::danger
Diese Operation erstellt neue Datensätze in der Datenbank. Stellen Sie sicher, dass die von Ihnen angegebenen Werte korrekt sind und dass Sie sich auf einer Testdatenbank befinden, wenn Sie nicht sicher sind.
:::

:::note[Seitenleistenfelder]
`Model` · `Context`
:::

![DevTools Panel - Create](/img/devtools-panel/create.png)

### Call Method {/* #call-method */}

Ruft jede öffentliche Methode auf einem Modell auf. Nützlich zum Auslösen von Geschäftslogik, Wizards oder benutzerdefinierten Methoden.

:::note[Seitenleistenfelder]
`Model` · `Record IDs` · `Domain` · `Context`
:::

![DevTools Panel - Call Method](/img/devtools-panel/call-method.png)

### Delete & Archive {/* #unlink */}

Archiviert, entarchiviert oder löscht die entsprechenden Datensätze endgültig.

:::danger
Diese Operation ändert oder löscht vorhandene Datensätze in der Datenbank endgültig. Stellen Sie sicher, dass die von Ihnen angegebenen IDs mit den Datensätzen übereinstimmen, die Sie ändern oder löschen möchten. Im Zweifelsfall testen Sie zuerst auf einer Testdatenbank.
:::

:::note[Seitenleistenfelder]
`Model` · `Record IDs` · `Domain` · `Context`
:::

![DevTools Panel - Delete & Archive](/img/devtools-panel/unlink.png)

## Anforderungsverlauf {/* #request-history */}

Das Panel behält einen Verlauf Ihrer letzten Abfragen (bis zu 150), zugänglich über den Reiter **History** im oberen Menü. Sie können die Details jeder Anfrage (Modell, Domäne, Payload, Antwort) durchsuchen und diese einfach erneut ausführen oder kopieren.

![DevTools Panel - Verlaufs-Reiter](/img/devtools-panel/history-tab.png)
