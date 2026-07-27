---
sidebar_position: 1
title: Erste Schritte
---

# Erste Schritte

**Odoo Toolbox** zielt darauf ab, die Erfahrung von Odoo- und Odoo.SH-Nutzern und -Entwicklern durch eine Vielzahl von Werkzeugen und Funktionen zu verbessern.

## Installation {/* #installation */}

### Chromium {/* #chromium */}

1. Besuchen Sie den [Chrome Web Store](https://chromewebstore.google.com/detail/odoo-toolbox/jgobnmpfeomiffhbedhfgbhelcnnelkd)
2. Klicken Sie auf **Zu Chrome hinzufügen**
3. Bestätigen Sie mit einem Klick auf **Erweiterung hinzufügen**

### Firefox {/* #firefox */}

1. Besuchen Sie die Seite [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/odoo-toolbox/)
2. Klicken Sie auf **Zu Firefox hinzufügen**
3. Bestätigen Sie mit einem Klick auf **Hinzufügen**

Nach der Installation erscheint das Odoo Toolbox-Symbol in der Symbolleiste Ihres Browsers.

---

## Schnellstart {/* #quick-start */}

### 1. Zu einer Odoo-Instanz navigieren {/* #navigate-to-odoo */}

Öffnen Sie Ihren Browser und gehen Sie zu einer Odoo-Instanz mit **Version 14 oder höher**.

### 2. Das Popup öffnen {/* #open-the-popup */}

Klicken Sie auf das **Odoo Toolbox**-Symbol in der Symbolleiste Ihres Browsers, um das Popup zu öffnen. Von hier aus können Sie:

- Den **Debug-Modus** ein- oder ausschalten (auch über Tastenkürzel verfügbar)
- Das **Thema** der Erweiterung zwischen Hell und Dunkel wechseln
- Auf Ihre **Odoo.SH-Projektfavoriten** zugreifen
- Die **Optionsseite** für erweiterte Einstellungen öffnen

### 3. Felder mit der Technischen Seitenleiste inspizieren {/* #inspect-fields */}

Auf jeder Odoo-Ansicht erscheint ein **schwebender Button** (standardmäßig) in der unteren rechten Ecke der Seite.

1. Klicken Sie auf den Button, um die **Technische Seitenleiste** zu öffnen
2. Durchsuchen Sie die technischen Informationen über die aktuelle Seite (Modell, Felder, Ansicht usw.)
3. Für mehr Präzision aktivieren Sie den **Elementauswahlmodus**, indem Sie auf das Cursor-Symbol oben rechts klicken
4. Klicken Sie auf ein beliebiges Feld auf der Seite, um seine technischen Details anzuzeigen:
    - Feldname (`name`, `partner_id`, ...)
    - Feldtyp (`Many2one`, `Char`, `Selection`, ...)
    - Zusätzliche Eigenschaften und Metadaten

### 4. Das DevTools Panel verwenden {/* #use-devtools-panel */}

Das DevTools Panel ermöglicht Ihnen die Interaktion mit der Odoo-RPC-Schicht, ohne Ihren Browser zu verlassen.

1. Öffnen Sie die **DevTools** Ihres Browsers (`F12` oder `Ctrl+Shift+I` / `Cmd+Option+I` auf Mac)
2. Navigieren Sie zum Reiter **Odoo Toolbox**
3. Wählen Sie einen Vorgangs-Reiter:
    - **Search** - Datensätze mit Domänenfiltern und Feldauswahl abfragen
    - **Write / Create / Unlink** - Datensätze mit JSON-Eingabe ändern
    - **Call Method** - eine beliebige Modellmethode ausführen

---

## Wie geht es weiter? {/* #whats-next */}

Erkunden Sie die Dokumentation für jeden Abschnitt:

- [Odoo](./odoo/overview) - Enthält alle Werkzeuge im Zusammenhang mit Odoo-Datenbanken im Allgemeinen
- [Odoo.SH](./odoosh/overview) - Enthält alle Werkzeuge im Zusammenhang mit Odoo.SH
- [Optionen](./options) - Kurzer Überblick über die Optionsseite zur Konfiguration der Erweiterung
