---
sidebar_position: 4
title: DevTools-paneel
toc_max_heading_level: 4
---

# DevTools-paneel

:::danger[Voorzichtig gebruiken]
De meeste bewerkingen die in dit paneel beschikbaar zijn (**Aanmaken**, **Bewerken**, **Verwijderen**, **Methode aanroepen**) schrijven rechtstreeks naar de database en zijn **onomkeerbaar**. Alleen de bewerking **Zoeken** is veilig omdat deze alleen-lezen is.

- Voer nooit schrijf- of verwijderbewerkingen uit op een productiedatabase tenzij u zeker weet wat u doet.
- Bij twijfel, test altijd eerst op een **testdatabase**.
  :::

Het DevTools-paneel is een volledige RPC-testinterface die direct is ingebed in de ontwikkelaarstools van uw browser. Het laat u records bevragen, aanmaken, bewerken, verwijderen en methoden aanroepen op elk Odoo-model zonder uw browser te verlaten.

## Het paneel openen {/* #opening-the-panel */}

1. Open de DevTools van uw browser (<kbd>F12</kbd> of <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>I</kbd> / <kbd>Cmd</kbd>+<kbd>Option</kbd>+<kbd>I</kbd> op macOS).
2. Zoek naar het tabblad **Odoo Toolbox** in de tabbalk van de DevTools.
3. Klik erop - het paneel opent en maakt automatisch verbinding met de huidige Odoo-pagina.

:::info
Als er een foutmelding verschijnt, zorg er dan voor dat u zich op een Odoo-pagina bevindt en verbonden bent met de backend (niet de website).
:::

![DevTools-paneel - overzicht](/img/devtools-panel/overview.png)

## De interface {/* #the-interface */}

Het paneel is verdeeld in twee hoofdgebieden:

- **Links / boven - Querybouwer**: hier configureert u het model, de bewerking, het domein, de velden en de payload.
- **Rechts / onder - Responsviewer**: hier wordt het JSON-antwoord weergegeven na uitvoering.

![DevTools-paneel - interfaceoverzicht](/img/devtools-panel/interface-overview.png)

### Zijbalk {/* #sidebar */}

De zijbalk aan de linkerzijde bevat de invoervelden voor het bouwen van uw query. De weergegeven velden veranderen afhankelijk van de geselecteerde bewerking (Zoeken, Aanmaken, Bewerken, Verwijderen, Methode aanroepen). Alle mogelijke velden worden getoond in het tabblad **Search**; andere bewerkingen tonen enkel de relevante velden.

:::info
Zelfs op een ander tabblad dan Search kunt u de zijbalkvelden invullen om een nieuwe zoekopdracht uit te voeren. Handig als u de set records wilt wijzigen waarop uw volgende actie wordt toegepast.
:::

#### Model {/* #model */}

Het veld **Model** verwacht een technische modelnaam (bijv. `res.partner`, `sale.order`). Het ondersteunt auto-aanvullen om u te helpen het juiste model te vinden.

#### IDs {/* #ids */}

Het veld **Record IDs** verwacht een JSON-array van record-ID's (bijv. `[1, 2, 3]`) of een door komma's gescheiden lijst (bijv. `1,2,3`). Het wordt gebruikt om specifieke records te targeten bij bewerken-, verwijderen- of methode-aanroepenoperaties.

#### Veldselectie {/* #field-selection */}

Het veld **Fields** heeft een zoekfunctie en een lijst met beschikbare velden voor het model. Het beperken van de opgehaalde velden maakt het antwoord beter leesbaar en de aanroep sneller.

Laat het invoerveld leeg om alle velden van het model terug te geven.

#### Domeinfilters {/* #domain-filters */}

Domeinen volgen de standaard [Odoo-domeinsyntax](https://www.odoo.com/documentation/master/developer/reference/backend/orm.html#search-domains): een JSON-array van voorwaarden gecombineerd met `&` (EN, standaard) en `|` (OF) prefix-operators.

```json
[
    ["state", "=", "done"],
    ["partner_id.country_id.code", "=", "US"]
]
```

Het paneel valideert het domein als JSON in real-time en markeert syntaxisfouten voordat u de query zelfs maar uitvoert.

:::tip
Gebruik een lege array `[]` om alle records te matchen (equivalent aan geen filter).
:::

#### Sorteren en paginering {/* #sorting-and-pagination */}

Het veld **Order By** laat u de sorteervolgorde van resultaten specificeren (bijv. `name ASC` of `create_date DESC`). Het heeft een zoekfunctie en een lijst met beschikbare velden voor het model.

Het veld **Limit** beperkt het aantal teruggegeven records, en **Offset** slaat een aantal records over (voor paginering).

#### Uitvoerknop {/* #execute-button */}

Zodra uw query is geconfigureerd, klikt u op **Execute Query** om deze uit te voeren. Het antwoord verschijnt in het rechtergebied.

#### Get Current-knop {/* #get-current-button */}

De knop **Get Current** vult de zijbalkvelden vooraf met waarden van de huidige Odoo-weergave. Als u zich bijvoorbeeld op een partnerformulier bevindt, vult het **Model** met `res.partner` en **Record IDs** met het ID van de weergegeven record. Als u meerdere records geselecteerd hebt in een lijstweergave, vult het **Record IDs** met al hun ID's.

### Responsviewer {/* #response-viewer */}

Na het uitvoeren van een aanroep worden de record(s) die aan de gedefinieerde criteria voldoen weergegeven in het antwoordgebied.

- Een knop **Copy** laat u het volledige antwoord naar uw klembord kopiëren. **Download** laat u het opslaan als een JSON-bestand.
- Fouten geretourneerd door Odoo (bijv. toegangsrechten, ontbrekende velden) worden weergegeven met hun bericht en traceback.

#### Weergaveopties {/* #display-options */}

Het antwoord staat standaard in lijstweergave. In het tabblad **Search** kunt u ook overschakelen naar tabelweergave via de wisselknop rechtsboven.

#### Record-actieknoppen {/* #record-action-buttons */}

In lijstweergave heeft elk record snelle actieknoppen om het te focussen, in Odoo te openen, of als popup te openen.

| Pictogram                                    | Actie                                                                                                                                                            |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ![Focus](/img/devtools-panel/focus-icon.png) | Focust het record in DevTools - handig als startpunt voor verdere bewerkingen (bewerken, verwijderen, methode aanroepen) op dat specifieke record.              |
| ![Open](/img/devtools-panel/open-icon.png)   | Opent het record in Odoo (vervangt de inhoud van het venster bovenliggend).                                                                                      |
| ![Popup](/img/devtools-panel/popup-icon.png) | Opent het record in een Odoo-popup - handig om snel de details van een record te bekijken zonder de context van uw huidige werk in het venster bovenliggend te verliezen. |

## Bewerkingen {/* #operations */}

Gebruik het bovenste menu om te kiezen wat u wilt doen. Elke bewerking toont enkel de zijbalkvelden die relevant zijn voor die bewerking.

### Zoeken {/* #search */}

De meest voorkomende bewerking en de standaardbewerking. Retourneert een lijst van records die aan de gegeven criteria voldoen (domein, model, ...).

:::note[Zijbalkvelden]
`Model` · `Record IDs` · `Fields` · `Domain` · `Order By` · `Limit` · `Offset` · `Context`
:::

![DevTools-paneel - Search](/img/devtools-panel/search.png)

### Bewerken {/* #write */}

Werkt bestaande records bij die aan de gegeven criteria voldoen.

:::danger
Deze bewerking wijzigt bestaande records in de database. Zorg ervoor dat de ID's die u opgeeft overeenkomen met de records die u wilt bijwerken, en dat de waarden correct zijn. Bij twijfel, test eerst op een testdatabase.
:::

:::note[Zijbalkvelden]
`Model` · `Record IDs` · `Domain` · `Context`
:::

![DevTools-paneel - Bewerken](/img/devtools-panel/write.png)

### Aanmaken {/* #create */}

Maakt een record aan met de gegeven waarden en geeft het weer zodra het is aangemaakt.

:::danger
Deze bewerking maakt nieuwe records aan in de database. Zorg ervoor dat de waarden die u opgeeft correct zijn, en dat u zich op een testdatabase bevindt als u niet zeker bent.
:::

:::note[Zijbalkvelden]
`Model` · `Context`
:::

![DevTools-paneel - Aanmaken](/img/devtools-panel/create.png)

### Methode aanroepen {/* #call-method */}

Roept een willekeurige publieke methode aan op een model. Handig voor het triggeren van bedrijfslogica, wizards of aangepaste methoden.

:::note[Zijbalkvelden]
`Model` · `Record IDs` · `Domain` · `Context`
:::

![DevTools-paneel - Call Method](/img/devtools-panel/call-method.png)

### Verwijderen & Archiveren {/* #unlink */}

Archiveert, dearchiveert of verwijdert definitief de records die voldoen aan de criteria.

:::danger
Deze bewerking wijzigt of verwijdert definitief bestaande records in de database. Zorg ervoor dat de ID's die u opgeeft overeenkomen met de records die u wilt wijzigen of verwijderen. Bij twijfel, test eerst op een testdatabase.
:::

:::note[Zijbalkvelden]
`Model` · `Record IDs` · `Domain` · `Context`
:::

![DevTools-paneel - Verwijderen & Archiveren](/img/devtools-panel/unlink.png)

## Requestgeschiedenis {/* #request-history */}

Het paneel houdt een geschiedenis bij van uw recente query's (tot 150), toegankelijk via het tabblad **History** in het bovenste menu. U kunt de details van elk verzoek (model, domein, payload, antwoord) doorbladeren en deze eenvoudig opnieuw uitvoeren of kopiëren.

![DevTools-paneel - History-tabblad](/img/devtools-panel/history-tab.png)
