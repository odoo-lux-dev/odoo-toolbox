---
sidebar_position: 3
title: Funzionalità aggiuntive
---

# Funzionalità aggiuntive

Questa pagina raccoglie le piccole utilità che Odoo Toolbox aggiunge all'interfaccia Odoo.SH per facilitare la gestione quotidiana dei progetti e dei branch. Queste funzionalità sono disponibili direttamente su [Odoo.SH](https://www.odoo.sh), senza alcuna configurazione richiesta.

## Scorciatoie per i branch {/* #branch-shortcuts */}

![Scorciatoie per i branch](/img/odoosh/additional-features/shortcuts.png)

### Copia del nome del branch {/* #branch-name-copy */}

Ogni riga di branch nella pagina di un progetto Odoo.SH dispone di un'icona di copia accanto al nome del branch. La clicchi per copiare istantaneamente il nome del branch negli appunti - utile per i comandi `git checkout`, i messaggi di commit o i nomi delle attività.

{/* ![Copia del nome del branch](/img/odoosh/additional-features/branch-copy.png) */}

### Link GitHub {/* #github-links */}

Odoo Toolbox aggiunge un link diretto a GitHub su ogni branch, che punta al branch corrispondente nel Suo repository GitHub. Niente più navigazione separata su GitHub alla ricerca del branch giusto.

{/* ![Link GitHub](/img/odoosh/additional-features/github-links.png) */}

### Integrazione delle attività {/* #task-integration */}

Odoo Toolbox può associare un branch Odoo.SH a un'attività nel Suo progetto Odoo. Quando viene rilevata una corrispondenza nel nome del branch, un link diretto all'attività viene visualizzato accanto al branch.

#### Come funziona

L'estensione analizza il nome di ogni branch utilizzando l'espressione regolare `/-(\d+)-/`. L'ID numerico catturato viene quindi iniettato in un URL personalizzabile tramite il placeholder `{{task_id}}`. Sia la regex che l'URL sono personalizzabili dalle opzioni dell'estensione.

Il modello predefinito corrisponde al formato: `VERSIONE-IDATTIVITA-DESCRIZIONE_OPZIONALE`

Esempi di nomi di branch riconosciuti: `17.0-12345-my-feature`, `15.0-6789-fixes`

Per configurare l'URL di destinazione, vada nelle **opzioni dell'estensione** e imposti l'URL con il placeholder `{{task_id}}`. Ad esempio:

```
https://mio-odoo.com/odoo/project/task/{{task_id}}
```

:::tip
Può impostare un URL specifico per ogni preferito dalla pagina **SH Favorites** nelle opzioni dell'estensione.
:::

## Indicatori di stato dei build compatibili con i daltonici {/* #colorblind-build-status */}

Per impostazione predefinita, Odoo.SH utilizza solo il colore per indicare gli stati dei build (verde, rosso, arancione). Odoo Toolbox arricchisce questi indicatori con icone e forme distinte, rendendo gli stati leggibili anche senza distinzione cromatica.

| Stato       | Indicatore visivo                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Successo    | <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#28a745" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>                                                                                                                                                                                                                          |
| Fallito     | <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc3545" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>                                                                                                                                                                                                         |
| In corso    | <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 12-8.373 8.373a1 1 0 1 1-3-3L12 9"/><path d="m18 15 4-4"/><path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5"/></svg> |
| In attesa   | <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 2 20 20"/><path d="M8.35 2.69A10 10 0 0 1 21.3 15.65"/><path d="M19.08 19.08A10 10 0 1 1 4.92 4.92"/></svg>                                                                                                                               |

{/* ![Indicatori di stato compatibili con i daltonici](/img/odoosh/additional-features/colorblind-status.png) */}

:::tip
Questa funzionalità è particolarmente utile quando utilizza Odoo.SH su un monitor mal calibrato o in un ambiente con forte illuminazione ambientale.
:::
