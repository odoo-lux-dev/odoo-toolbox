---
sidebar_position: 1
title: Per iniziare
---

# Per iniziare

**Odoo Toolbox** mira a migliorare l'esperienza degli utenti e sviluppatori Odoo / Odoo.SH aggiungendo una varietà di strumenti e funzionalità.

## Installazione {/* #installation */}

### Chromium {/* #chromium */}

1. Visiti lo [Chrome Web Store](https://chromewebstore.google.com/detail/odoo-toolbox/jgobnmpfeomiffhbedhfgbhelcnnelkd)
2. Clicchi su **Aggiungi a Chrome**
3. Confermi cliccando su **Aggiungi estensione**

### Firefox {/* #firefox */}

1. Visiti la pagina [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/odoo-toolbox/)
2. Clicchi su **Aggiungi a Firefox**
3. Confermi cliccando su **Aggiungi**

Una volta installata, l'icona di Odoo Toolbox apparirà nella barra degli strumenti del suo browser.

---

## Avvio rapido {/* #quick-start */}

### 1. Accedere a un'istanza Odoo {/* #navigate-to-odoo */}

Apra il suo browser e vada a un'istanza Odoo in **versione 14 o superiore**.

### 2. Aprire il popup {/* #open-the-popup */}

Clicchi sull'icona **Odoo Toolbox** nella barra degli strumenti del suo browser per aprire il popup. Da qui può:

- Attivare o disattivare la **modalità debug** (disponibile anche tramite scorciatoia da tastiera)
- Passare dal **tema** dell'estensione chiaro a scuro
- Accedere ai suoi **progetti preferiti Odoo.SH**
- Aprire la **pagina Options** per le impostazioni avanzate

### 3. Ispezionare i campi con il Technical Sidebar {/* #inspect-fields */}

Su qualsiasi vista Odoo, un **pulsante fluttuante** appare nell'angolo in basso a destra (per impostazione predefinita) della pagina.

1. Clicchi sul pulsante per aprire il **Technical Sidebar**
2. Sfogli le informazioni tecniche sulla pagina corrente (modello, campi, vista, ecc.)
3. Per maggiore precisione, attivi la **modalità di selezione degli elementi** cliccando sull'icona del cursore in alto a destra
4. Clicchi su qualsiasi campo della pagina per visualizzarne i dettagli tecnici:
    - Nome del campo (`name`, `partner_id`, ...)
    - Tipo di campo (`Many2one`, `Char`, `Selection`, ...)
    - Proprietà e metadati aggiuntivi

### 4. Utilizzare il pannello DevTools {/* #use-devtools-panel */}

Il pannello DevTools Le permette di interagire con il livello RPC di Odoo senza lasciare il Suo browser.

1. Apra i **DevTools** del Suo browser (`F12` o `Ctrl+Shift+I` / `Cmd+Option+I` su Mac)
2. Navighi fino alla scheda **Odoo Toolbox**
3. Selezioni una scheda di operazione:
    - **Search** - interroghi record con filtri di dominio e selezione dei campi
    - **Write / Create / Unlink** - modifichi record con input JSON
    - **Call Method** - esegua qualsiasi metodo di modello

---

## E adesso? {/* #whats-next */}

Esplori la documentazione di ogni sezione:

- [Odoo](./odoo/overview) - Contiene tutti gli strumenti relativi ai database Odoo in generale
- [Odoo.SH](./odoosh/overview) - Contiene tutti gli strumenti relativi a Odoo.SH
- [Options](./options) - Panoramica rapida della pagina Options per la configurazione dell'estensione
