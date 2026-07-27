---
sidebar_position: 3
title: Zusätzliche Funktionen
---

# Zusätzliche Funktionen

Diese Seite behandelt die kleinen Dienstprogramme, die Odoo Toolbox zur Odoo.SH-Oberfläche hinzufügt, um Ihre tägliche Projekt- und Branch-Verwaltung zu erleichtern. Diese Funktionen sind direkt auf [Odoo.SH](https://www.odoo.sh) verfügbar, ohne dass eine Konfiguration erforderlich ist.

## Branch-Verknüpfungen {/* #branch-shortcuts */}

![Branch-Verknüpfungen](/img/odoosh/additional-features/shortcuts.png)

### Branch-Namen kopieren {/* #branch-name-copy */}

Jede Branch-Zeile auf einer Odoo.SH-Projektseite hat ein **Kopiersymbol** neben dem Branchnamen. Klicken Sie darauf, um den Branchnamen sofort in Ihre Zwischenablage zu kopieren - praktisch für `git checkout`-Befehle, Commit-Nachrichten oder Task-Namen.

{/* ![Branch-Namen kopieren](/img/odoosh/additional-features/branch-copy.png) */}

### GitHub-Links {/* #github-links */}

Odoo Toolbox fügt jedem Branch einen direkten **GitHub-Link** hinzu, der auf den entsprechenden Branch in Ihrem GitHub-Repository verweist. Kein separates Navigieren zu GitHub mehr und Suchen nach dem richtigen Branch.

{/* ![GitHub-Links](/img/odoosh/additional-features/github-links.png) */}

### Task-Integration {/* #task-integration */}

Odoo Toolbox kann einen Odoo.SH-Branch mit einer Task in Ihrem Odoo-Projekt verknüpfen. Wenn eine Übereinstimmung im Branchnamen erkannt wird, wird ein direkter Link zur Task neben dem Branch angezeigt.

#### Funktionsweise

Die Erweiterung analysiert jeden Branchnamen mit dem regulären Ausdruck `/-(\d+)-/`. Die erfasste numerische ID wird dann über den Platzhalter `{{task_id}}` in eine anpassbare URL injiziert. Sowohl der reguläre Ausdruck als auch die URL können in den Erweiterungsoptionen angepasst werden.

Das Standardmuster entspricht dem Format: `VERSION-TASKID-OPTIONALE_BESCHREIBUNG`

Beispiele für erkannte Branchnamen: `17.0-12345-my-feature`, `15.0-6789-fixes`

Um die Ziel-URL zu konfigurieren, gehen Sie zu den **Erweiterungsoptionen** und geben Sie die URL mit dem Platzhalter `{{task_id}}` ein. Zum Beispiel:

```
https://my-odoo.com/odoo/project/task/{{task_id}}
```

:::tip
Sie können eine spezifische URL pro Favorit über die Seite **SH Favorites** in den Erweiterungsoptionen festlegen.
:::

## Farbenblindenfreundlicher Build-Status {/* #colorblind-build-status */}

Standardmäßig verwendet Odoo.SH nur Farben, um Build-Status zu vermitteln (grün, rot, orange). Odoo Toolbox erweitert diese Indikatoren mit unterschiedlichen Symbolen und Formen, sodass die Status auch ohne Farbunterscheidung lesbar sind.

| Status       | Visueller Indikator                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Erfolg       | <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#28a745" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>                                                                                                                                                                                                                          |
| Fehlgeschlagen | <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc3545" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>                                                                                                                                                                                                         |
| Laufend      | <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 12-8.373 8.373a1 1 0 1 1-3-3L12 9"/><path d="m18 15 4-4"/><path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5"/></svg> |
| Wartend       | <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 2 20 20"/><path d="M8.35 2.69A10 10 0 0 1 21.3 15.65"/><path d="M19.08 19.08A10 10 0 1 1 4.92 4.92"/></svg>                                                                                                                               |

{/* ![Farbenblindenfreundlicher Build-Status](/img/odoosh/additional-features/colorblind-status.png) */}

:::tip
Diese Funktion ist besonders nützlich, wenn Sie Odoo.SH auf einem schlecht kalibrierten Monitor oder in einer Umgebung mit starker Umgebungsbeleuchtung verwenden.
:::
