---
sidebar_position: 4
title: Pannello DevTools
toc_max_heading_level: 4
---

# Pannello DevTools

:::danger[Usare con cautela]
La maggior parte delle operazioni disponibili in questo pannello (**Create**, **Update**, **Delete**, **Call Method**) scrive direttamente nel database e sono **irreversibili**. Solo l'operazione **Search** è sicura in quanto è in sola lettura.

- Non esegua mai operazioni di scrittura o eliminazione su un database di produzione senza essere certo di ciò che sta facendo.
- In caso di dubbio, testi sempre prima su un **database di test**.
  :::

Il pannello DevTools è una completa interfaccia di test RPC integrata direttamente negli strumenti di sviluppo del Suo browser. Le permette di interrogare, creare, aggiornare, eliminare record e chiamare metodi su qualsiasi modello Odoo senza lasciare il browser.

## Aprire il pannello {/* #opening-the-panel */}

1. Apra i DevTools del Suo browser (<kbd>F12</kbd> o <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>I</kbd> / <kbd>Cmd</kbd>+<kbd>Option</kbd>+<kbd>I</kbd> su macOS).
2. Cerchi la scheda **Odoo Toolbox** nella barra delle schede dei DevTools.
3. Ci clicchi sopra - il pannello si apre e si connette automaticamente alla pagina Odoo corrente.

:::info
Se compare un messaggio di errore, si assicuri di trovarsi su una pagina Odoo e di essere connesso al backend (non al sito web).
:::

![Pannello DevTools - panoramica](/img/devtools-panel/overview.png)

## L'interfaccia {/* #the-interface */}

Il pannello è diviso in due aree principali:

- **Sinistra / alto - Costruttore di query**: dove configura il modello, l'operazione, il dominio, i campi e il payload.
- **Destra / basso - Visualizzatore di risposta**: dove viene visualizzata la risposta JSON dopo l'esecuzione.

![Pannello DevTools - panoramica dell'interfaccia](/img/devtools-panel/interface-overview.png)

### Barra laterale {/* #sidebar */}

La barra laterale sulla sinistra contiene i campi di input utilizzati per costruire la query. I campi visualizzati cambiano in base all'operazione selezionata (Search, Create, Update, Delete, Call Method). Tutti i campi possibili sono mostrati nella scheda **Search**; le altre operazioni mostrano solo i campi pertinenti.

:::info
Anche quando si trova in una scheda diversa da Search, può compilare i campi della barra laterale per eseguire una nuova ricerca. Utile se vuole cambiare l'insieme di record su cui verrà eseguita la prossima azione.
:::

#### Model {/* #model */}

Il campo **Model** richiede un nome tecnico del modello (es. `res.partner`, `sale.order`). Supporta il completamento automatico per aiutarla a trovare il modello giusto.

#### ID {/* #ids */}

Il campo **Record IDs** richiede un array JSON di ID di record (es. `[1, 2, 3]`) o una lista separata da virgole (es. `1,2,3`). Viene utilizzato per individuare record specifici nelle operazioni di aggiornamento, eliminazione o chiamata di metodo.

#### Selezione dei campi {/* #field-selection */}

Il campo **Fields** dispone di una ricerca e di un elenco dei campi disponibili per il modello. Limitare i campi da recuperare rende la risposta più leggibile e la chiamata più veloce.

Lasci il campo vuoto per restituire tutti i campi del modello.

#### Filtri di dominio {/* #domain-filters */}

I domini seguono la [sintassi di dominio Odoo](https://www.odoo.com/documentation/master/developer/reference/backend/orm.html#search-domains) standard: un array JSON di condizioni combinate con gli operatori prefisso `&` (AND, predefinito) e `|` (OR).

```json
[
    ["state", "=", "done"],
    ["partner_id.country_id.code", "=", "US"]
]
```

Il pannello valida il dominio come JSON in tempo reale e segnala gli errori di sintassi ancora prima che venga eseguita la query.

:::tip
Usi un array vuoto `[]` per corrispondere a tutti i record (equivalente a nessun filtro).
:::

#### Ordinamento e impaginazione {/* #sorting-and-pagination */}

Il campo **Order By** permette di specificare l'ordinamento dei risultati (es. `name ASC` o `create_date DESC`). Dispone di una ricerca e di un elenco dei campi disponibili per il modello.

Il campo **Limit** limita il numero di record restituiti, mentre **Offset** salta un certo numero di record (per l'impaginazione).

#### Pulsante di esecuzione {/* #execute-button */}

Una volta configurata la query, clicchi su **Execute Query** per eseguirla. La risposta appare nell'area di destra.

#### Pulsante Get Current {/* #get-current-button */}

Il pulsante **Get Current** precompila i campi della barra laterale con i valori della vista Odoo corrente. Ad esempio, se si trova nella scheda di un partner, compilerà **Model** con `res.partner` e **Record IDs** con l'ID del record visualizzato. Se ha selezionato più record in una vista lista, compilerà **Record IDs** con tutti i rispettivi ID.

### Visualizzatore di risposta {/* #response-viewer */}

Dopo l'esecuzione di una chiamata, i record che corrispondono ai criteri definiti vengono visualizzati nell'area di risposta.

- Un pulsante **Copy** permette di copiare l'intera risposta negli appunti. **Download** permette di salvarla come file JSON.
- Gli errori restituiti da Odoo (es. diritti di accesso, campi mancanti) vengono visualizzati con il loro messaggio e traceback.

#### Opzioni di visualizzazione {/* #display-options */}

La risposta viene visualizzata per impostazione predefinita come vista lista. Nella scheda **Search**, può anche passare alla vista tabella tramite il pulsante in alto a destra.

#### Pulsanti di azione sui record {/* #record-action-buttons */}

Nella vista lista, ogni record dispone di pulsanti di azione rapida per metterlo a fuoco, aprirlo in Odoo o aprirlo come popup.

| Icona                                        | Azione                                                                                                                                                                       |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ![Focus](/img/devtools-panel/focus-icon.png) | Mette a fuoco il record nei DevTools - utile come punto di partenza per ulteriori operazioni (aggiornamento, eliminazione, chiamata di metodo) su quel record specifico.   |
| ![Open](/img/devtools-panel/open-icon.png)   | Apre il record in Odoo (sostituisce il contenuto della finestra padre).                                                                                                        |
| ![Popup](/img/devtools-panel/popup-icon.png) | Apre il record in un popup Odoo - utile per ispezionare rapidamente i dettagli di un record senza perdere il contesto del lavoro in corso nella finestra padre.              |

## Operazioni {/* #operations */}

Usi il menu in alto per scegliere cosa vuole fare. Ogni operazione mostra solo i campi della barra laterale ad essa pertinenti.

### Search {/* #search */}

L'operazione più comune e quella predefinita. Restituisce un elenco di record che corrispondono ai criteri specificati (dominio, modello, …).

:::note[Campi della barra laterale]
`Model` · `Record IDs` · `Fields` · `Domain` · `Order By` · `Limit` · `Offset` · `Context`
:::

![Pannello DevTools - Search](/img/devtools-panel/search.png)

### Write {/* #write */}

Aggiorna i record esistenti che corrispondono ai criteri specificati.

:::danger
Questa operazione modifica i record esistenti nel database. Si assicuri che gli ID forniti corrispondano ai record che intende aggiornare e che i valori siano corretti. In caso di dubbio, testi prima su un database di test.
:::

:::note[Campi della barra laterale]
`Model` · `Record IDs` · `Domain` · `Context`
:::

![Pannello DevTools - Write](/img/devtools-panel/write.png)

### Create {/* #create */}

Crea un record con i valori specificati e lo visualizza una volta creato.

:::danger
Questa operazione crea nuovi record nel database. Si assicuri che i valori forniti siano corretti e che si trovi su un database di test in caso di incertezza.
:::

:::note[Campi della barra laterale]
`Model` · `Context`
:::

![Pannello DevTools - Create](/img/devtools-panel/create.png)

### Call Method {/* #call-method */}

Chiama qualsiasi metodo pubblico su un modello. Utile per attivare logiche di business, wizard o metodi personalizzati.

:::note[Campi della barra laterale]
`Model` · `Record IDs` · `Domain` · `Context`
:::

![Pannello DevTools - Call Method](/img/devtools-panel/call-method.png)

### Delete & Archive {/* #unlink */}

Archivia, disarchivia o elimina definitivamente i record corrispondenti.

:::danger
Questa operazione modifica o elimina definitivamente i record esistenti nel database. Si assicuri che gli ID forniti corrispondano ai record che intende modificare o eliminare. In caso di dubbio, testi prima su un database di test.
:::

:::note[Campi della barra laterale]
`Model` · `Record IDs` · `Domain` · `Context`
:::

![Pannello DevTools - Delete & Archive](/img/devtools-panel/unlink.png)

## Cronologia delle richieste {/* #request-history */}

Il pannello conserva una cronologia delle Sue query recenti (fino a 150), accessibile tramite la scheda **History** nel menu in alto. Può consultare i dettagli di ogni richiesta (modello, dominio, payload, risposta) ed eseguirla nuovamente o copiarla facilmente.

![Pannello DevTools - Scheda History](/img/devtools-panel/history-tab.png)
