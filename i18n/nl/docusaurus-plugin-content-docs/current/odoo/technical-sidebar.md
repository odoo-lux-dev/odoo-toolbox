---
sidebar_position: 3
title: Technische zijbalk
---

# Technische zijbalk

:::warning
Deze functie ondersteunt enkel Odoo-versie 16 en later.
:::

De Technische zijbalk is een zwevend inspectiepaneel dat over elke Odoo-pagina wordt gelegd. Het laat u velden, hun types, eigenschappen en metadata in real-time inspecteren zonder de pagina te verlaten of de DevTools te openen.

## De zijbalk activeren {/* #activate-the-sidebar */}

De zijbalk wordt geactiveerd vanuit de [Extensie-popup](./popup): klik op het extensiepictogram in de werkbalk van uw browser en schakel vervolgens de **Technische zijbalk** in. Deze kan ook worden geactiveerd vanuit de [extensie-opties](../options).

## Overzicht {/* #overview */}

De zijbalk is een verankerd paneel aan de zijkant van de pagina. Het bevat:

- **Database-informatie**: toont informatie over de huidige database, zoals de naam, versie, enz.
- **Recordinformatie**: toont informatie over het record van de huidige weergave, zoals het ID, model, enz.
- **De veldenlijst**: toont alle velden van het huidige model met wat technische informatie.
- **De actielijst**: toont alle beschikbare acties voor het huidige model met wat technische informatie.
- **De zoekbalk**: filtert de velden- en actielijst op technische naam, weergavelabel of type.

![Technische zijbalk - interface](/img/technical-sidebar/interface.png)

:::info
De debugmodus hoeft niet te zijn ingeschakeld om toegang te krijgen tot de informatie.
:::

## Functies {/* #features */}

### Database-informatie {/* #database-information */}

Informatie over de huidige database wordt bovenaan de zijbalk weergegeven, waaronder:

- De Odoo-versie
- De databasenaam
- De huidige taal
- De status van de ontwikkelaarsmodus

![Technische zijbalk - database-informatie](/img/technical-sidebar/database-information.png)

### Recordinformatie {/* #record-information */}

Informatie over het record van de huidige weergave wordt onder de database-informatie weergegeven, waaronder:

- De modelnaam (bijv. `res.partner`, `sale.order`)
- Het record-ID
- Het weergavetype (bijv. `form`, `list`, `kanban`)
- Het actietype (bijv. `ir.actions.act_window`)
- De actienaam (bijv. Partners weergeven)
- Het actie-ID
- Het XML-ID van de actie (bijv. `base.action_res_partner_form`)
- De actiecontext (bijv. `{'search_default_group_by_country': 1}`)

![Technische zijbalk - recordinformatie](/img/technical-sidebar/record-information.png)

#### Actieknoppen {/* #action-buttons */}

In deze sectie zijn ook verschillende actieknoppen beschikbaar om verschillende acties uit te voeren:

- Modelvelden weergeven
- Toegangsrechten van het model weergeven
- Recordregels van het model weergeven
- Beschikbare acties voor het model weergeven
- De actie gekoppeld aan de huidige weergave weergeven
- De gegevens van het huidige record als JSON weergeven

![Technische zijbalk - actieknoppen](/img/technical-sidebar/record-actions.png)

### Velden- en actielijst {/* #fields-and-actions-list */}

De velden en acties van het huidige model worden in de zijbalk opgesomd met wat technische informatie. Filters en een zoekbalk zijn ook beschikbaar om snel een specifiek veld of actie te vinden.

Wanneer u de muisaanwijzer over een item in de lijst beweegt, wordt dit op de pagina gemarkeerd, zodat u het visueel kunt identificeren.

![Technische zijbalk - hover](/img/technical-sidebar/fields-highlight.png)

### Veld- of actiedetails {/* #field-or-action-details */}

Het is ook mogelijk om een modus in te schakelen die u laat klikken op een veld of actie om de technische details ervan in de zijbalk weer te geven. Dit geeft u gerichte informatie over dat specifieke veld of die actie.

Deze modus wordt ingeschakeld door te klikken op de inspectieknop rechtsboven in de zijbalk.

![Technische zijbalk - inspectiemodus](/img/technical-sidebar/field-selected.png)
