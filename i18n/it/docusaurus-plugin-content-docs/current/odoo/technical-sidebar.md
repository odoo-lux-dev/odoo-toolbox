---
sidebar_position: 3
title: Technical Sidebar
---

# Technical Sidebar

:::warning
Questa funzionalità supporta solo Odoo versione 16 e successive.
:::

Il Technical Sidebar è un pannello di ispezione fluttuante che si sovrappone a qualsiasi pagina Odoo. Le permette di ispezionare in tempo reale i campi, i loro tipi, le proprietà e i metadati senza lasciare la pagina né aprire i DevTools.

## Attivare la barra laterale {/* #activate-the-sidebar */}

La barra laterale si attiva dal [popup dell'estensione](./popup): clicchi sull'icona dell'estensione nella barra degli strumenti del browser, poi attivi l'interruttore **Technical Sidebar**. Può anche essere attivata dalle [opzioni dell'estensione](../options).

## Panoramica {/* #overview */}

La barra laterale è un pannello ancorato sul lato della pagina. Contiene:

- **Informazioni sul database**: visualizza informazioni sul database corrente, come il nome, la versione, ecc.
- **Informazioni sul record**: visualizza informazioni sul record della vista corrente, come l'ID, il modello, ecc.
- **L'elenco dei campi**: visualizza tutti i campi del modello corrente con alcune informazioni tecniche.
- **L'elenco delle azioni**: visualizza tutte le azioni disponibili per il modello corrente con alcune informazioni tecniche.
- **La barra di ricerca**: filtra l'elenco dei campi e delle azioni per nome tecnico, etichetta visualizzata o tipo.

![Technical Sidebar - interfaccia](/img/technical-sidebar/interface.png)

:::info
Non è necessario attivare la modalità debug per accedere alle informazioni.
:::

## Funzionalità {/* #features */}

### Informazioni sul database {/* #database-information */}

Le informazioni sul database corrente sono visualizzate in cima alla barra laterale, tra cui:

- La versione di Odoo
- Il nome del database
- La lingua corrente
- Lo stato della modalità sviluppatore

![Technical Sidebar - informazioni sul database](/img/technical-sidebar/database-information.png)

### Informazioni sul record {/* #record-information */}

Le informazioni sul record della vista corrente sono visualizzate sotto le informazioni sul database, tra cui:

- Il nome del modello (es. `res.partner`, `sale.order`)
- L'ID del record
- Il tipo di vista (es. `form`, `list`, `kanban`)
- Il tipo di azione (es. `ir.actions.act_window`)
- Il nome dell'azione (es. `Mostra partner`)
- L'ID dell'azione
- L'XML ID dell'azione (es. `base.action_res_partner_form`)
- Il contesto dell'azione (es. `{'search_default_group_by_country': 1}`)

![Technical Sidebar - informazioni sul record](/img/technical-sidebar/record-information.png)

#### Pulsanti di azione {/* #action-buttons */}

Diversi pulsanti di azione sono disponibili in questa sezione per eseguire diverse operazioni:

- Mostrare i campi del modello
- Mostrare i diritti di accesso del modello
- Mostrare le regole di record del modello
- Mostrare le azioni disponibili per il modello
- Mostrare l'azione collegata alla vista corrente
- Mostrare i dati del record corrente in formato JSON

![Technical Sidebar - pulsanti di azione](/img/technical-sidebar/record-actions.png)

### Elenco dei campi e delle azioni {/* #fields-and-actions-list */}

I campi e le azioni del modello corrente sono elencati nella barra laterale con alcune informazioni tecniche. Sono disponibili filtri e una barra di ricerca per trovare rapidamente un campo o un'azione specifica.

Passando il mouse su un elemento dell'elenco, questo viene evidenziato sulla pagina, permettendo di identificarlo visivamente.

![Technical Sidebar - passaggio del mouse](/img/technical-sidebar/fields-highlight.png)

### Dettagli di un campo o di un'azione {/* #field-or-action-details */}

È anche possibile attivare una modalità che permette di cliccare su un campo o un'azione per visualizzarne i dettagli tecnici nella barra laterale. Questo fornisce informazioni mirate su quel campo o azione specifica.

Questa modalità si attiva cliccando sul pulsante di ispezione in alto a destra della barra laterale.

![Technical Sidebar - modalità di ispezione](/img/technical-sidebar/field-selected.png)
