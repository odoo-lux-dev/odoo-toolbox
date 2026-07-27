---
sidebar_position: 3
title: Aanvullende functies
---

# Aanvullende functies

Deze pagina behandelt de kleine hulpprogramma's die Odoo Toolbox toevoegt aan de Odoo.SH-interface om uw dagelijks project- en branchbeheer te vergemakkelijken. Deze functies zijn direct beschikbaar op [Odoo.SH](https://www.odoo.sh), zonder configuratie.

## Branchsnelkoppelingen {/* #branch-shortcuts */}

![Branchsnelkoppelingen](/img/odoosh/additional-features/shortcuts.png)

### Branchnaam kopiëren {/* #branch-name-copy */}

Elke branchrij op een Odoo.SH-projectpagina heeft een **kopieerpictogram** naast de branchnaam. Klik erop om de branchnaam direct naar uw klembord te kopiëren - handig voor `git checkout`-commando's, commitberichten of taaknamen.

{/* ![Branchnaam kopiëren](/img/odoosh/additional-features/branch-copy.png) */}

### GitHub-links {/* #github-links */}

Odoo Toolbox voegt een directe **GitHub-link** toe aan elke branch, verwijzend naar de overeenkomstige branch in uw GitHub-repository. Geen navigeren meer naar GitHub en zoeken naar de juiste branch.

{/* ![GitHub-links](/img/odoosh/additional-features/github-links.png) */}

### Taakintegratie {/* #task-integration */}

Odoo Toolbox kan een Odoo.SH-branch koppelen aan een taak in uw Odoo-project. Wanneer een overeenkomst wordt gedetecteerd in de branchnaam, wordt een directe link naar de taak weergegeven naast de branch.

#### Hoe het werkt

De extensie analyseert elke branchnaam met de reguliere expressie `/-(\d+)-/`. Het vastgelegde numerieke ID wordt vervolgens geïnjecteerd in een aanpasbare URL via de `{{task_id}}`-placeholder. Zowel de regex als de URL kunnen worden aangepast vanuit de extensie-opties.

Het standaardpatroon komt overeen met het formaat: `VERSION-TASKID-OPTIONAL_DESCRIPTION`

Voorbeelden van herkende branchnamen: `17.0-12345-my-feature`, `15.0-6789-fixes`

Om de doel-URL te configureren, gaat u naar de **extensie-opties** en stelt u de URL in met de `{{task_id}}`-placeholder. Bijvoorbeeld:

```
https://my-odoo.com/odoo/project/task/{{task_id}}
```

:::tip
U kunt een specifieke URL per favoriet instellen vanuit de pagina **SH Favorites** in de extensie-opties.
:::

## Kleurenblindvriendelijke build-status {/* #colorblind-build-status */}

Standaard gebruikt Odoo.SH uitsluitend kleur om build-statussen weer te geven (groen, rood, oranje). Odoo Toolbox verrijkt deze indicatoren met distincte pictogrammen en vormen, waardoor de statussen ook zonder kleuronderscheiding leesbaar zijn.

| Status      | Visuele indicator                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Succes      | <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#28a745" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>                                                                                                                                                                                                                          |
| Gefaald     | <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc3545" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>                                                                                                                                                                                                         |
| Bezig       | <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 12-8.373 8.373a1 1 0 1 1-3-3L12 9"/><path d="m18 15 4-4"/><path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5"/></svg> |
| Wachtend    | <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 2 20 20"/><path d="M8.35 2.69A10 10 0 0 1 21.3 15.65"/><path d="M19.08 19.08A10 10 0 1 1 4.92 4.92"/></svg>                                                                                                                               |

{/* ![Kleurenblindvriendelijke build-status](/img/odoosh/additional-features/colorblind-status.png) */}

:::tip
Deze functie is vooral handig bij het gebruik van Odoo.SH op een slecht gekalibreerd beeldscherm of in een omgeving met veel omgevingslicht.
:::
