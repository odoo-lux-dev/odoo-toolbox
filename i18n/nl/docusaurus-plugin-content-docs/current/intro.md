---
sidebar_position: 1
title: Aan de slag
---

# Aan de slag

**Odoo Toolbox** beoogt de ervaring van Odoo- en Odoo.SH-gebruikers en -ontwikkelaars te verbeteren door een verscheidenheid aan tools en functies toe te voegen.

## Installatie {/* #installation */}

### Chromium {/* #chromium */}

1. Ga naar de [Chrome Web Store](https://chromewebstore.google.com/detail/odoo-toolbox/jgobnmpfeomiffhbedhfgbhelcnnelkd)
2. Klik op **Toevoegen aan Chrome**
3. Bevestig door op **Extensie toevoegen** te klikken

### Firefox {/* #firefox */}

1. Ga naar de [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/odoo-toolbox/) pagina
2. Klik op **Toevoegen aan Firefox**
3. Bevestig door op **Toevoegen** te klikken

Na installatie verschijnt het Odoo Toolbox-pictogram in de werkbalk van uw browser.

---

## Snel aan de slag {/* #quick-start */}

### 1. Naar een Odoo-instantie navigeren {/* #navigate-to-odoo */}

Open uw browser en ga naar een Odoo-instantie met **versie 14 of hoger**.

### 2. De popup openen {/* #open-the-popup */}

Klik op het **Odoo Toolbox**-pictogram in de werkbalk van uw browser om de popup te openen. Vanuit hier kunt u:

- De **debugmodus** in- of uitschakelen (ook beschikbaar via een sneltoets)
- Het **thema** van de extensie wisselen tussen licht en donker
- Toegang krijgen tot uw **Odoo.SH-projectfavorieten**
- De **Options-pagina** openen voor geavanceerde instellingen

### 3. Velden inspecteren met de Technische zijbalk {/* #inspect-fields */}

Op elke Odoo-weergave verschijnt een **zwevende knop** in de rechterbenedenhoek (standaard) van de pagina.

1. Klik op de knop om de **Technische zijbalk** te openen
2. Doorblader de technische informatie over de huidige pagina (model, velden, weergave, enz.)
3. Voor meer precisie, activeer de **elementkiezermodus** door op het cursorpictogram rechtsboven te klikken
4. Klik op een willekeurig veld op de pagina om de technische details weer te geven:
    - Veldnaam (`name`, `partner_id`, ...)
    - Veldtype (`Many2one`, `Char`, `Selection`, ...)
    - Aanvullende eigenschappen en metadata

### 4. Het DevTools-paneel gebruiken {/* #use-devtools-panel */}

Het DevTools-paneel laat u communiceren met de Odoo RPC-laag zonder uw browser te verlaten.

1. Open de **DevTools** van uw browser (`F12` of `Ctrl+Shift+I` / `Cmd+Option+I` op Mac)
2. Navigeer naar het tabblad **Odoo Toolbox**
3. Selecteer een bewerkingstab:
    - **Search** - bevraag records met domeinfilters en veldselectie
    - **Write / Create / Unlink** - wijzig records met JSON-invoer
    - **Call Method** - voer een willekeurige modelmethode uit

---

## Wat nu? {/* #whats-next */}

Verken de documentatie van elke sectie:

- [Odoo](./odoo/overview) - Bevat alle tools gerelateerd aan Odoo-databases in het algemeen
- [Odoo.SH](./odoosh/overview) - Bevat alle tools gerelateerd aan Odoo.SH
- [Options](./options) - Kort overzicht van de Options-pagina voor extensieconfiguratie
