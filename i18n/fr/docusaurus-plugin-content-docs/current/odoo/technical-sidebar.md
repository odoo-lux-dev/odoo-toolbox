---
sidebar_position: 3
title: Barre latérale technique
---

# Barre latérale technique

:::warning
Cette fonctionnalité supporte uniquement la version 16 et ultérieure d'Odoo.
:::

La barre latérale technique est un panneau d'inspection flottant qui se superpose à n'importe quelle page Odoo. Elle vous permet d'inspecter en temps réel les champs, leurs types, leurs propriétés et leurs métadonnées sans quitter la page ni ouvrir les DevTools.

## Activer la barre latérale {#activate-the-sidebar}

La barre latérale s'active depuis le [popup de l'extension](./popup) : cliquez sur l'icône de l'extension dans la barre d'outils de votre navigateur, puis activez le bouton **Barre latérale technique**. Elle s'active également depuis les [options de l'extension](../options).

## Présentation {#overview}

La barre latérale se présente sous la forme d'un panneau ancré sur le côté de la page. Elle contient :

- **Des informations sur la database** : affiche des informations sur la database courante, comme son nom, la version etc.
- **Des informations sur l'enregistrement** : affiche des informations sur l'enregistrement de la vue en cours, comme son ID, son modèle etc.
- **La liste des champs** : affiche tous les champs du modèle courant avec quelques informations techniques.
- **La liste des actions** : affiche toutes les actions disponibles pour le modèle courant avec quelques informations techniques.
- **La barre de recherche** : filtre la liste des champs et actions par nom technique, nom affiché ou type.

![Barre latérale technique - interface](/img/technical-sidebar/interface.png)

:::info
Il n'est pas nécessaire d'avoir le mode débug activé pour accéder aux informations.
:::

## Fonctionnalités {#features}

### Informations sur la database {#database-information}

Des informations sur la database courante sont affichées en haut de la barre latérale, notamment :

- La version d'Odoo
- Le nom de la database
- La langue courante
- Le status du mode développeur

![Barre latérale technique - informations sur la database](/img/technical-sidebar/database-information.png)

### Informations sur l'enregistrement {#record-information}

Des informations sur l'enregistrement de la vue courante sont affichées sous les informations sur la database, notamment :

- Le nom du modèle (ex. `res.partner`, `sale.order`)
- L'ID de l'enregistrement
- Le type de vue (ex. `form`, `list`, `kanban`)
- Le type d'action (ex. `ir.actions.act_window`)
- Le nom de l'action (ex. `Afficher les partenaires`)
- L'ID de l'action
- L'XML ID de l'action (ex. `base.action_res_partner_form`)
- Le contexte de l'action (ex. `{'search_default_group_by_country': 1}`)

![Barre latérale technique - informations sur l'enregistrement](/img/technical-sidebar/record-information.png)

#### Boutons d'actions {#action-buttons}

Plusieurs boutons d'actions sont également disponibles dans cette section et permettent d'effectuer différentes actions :

- Afficher les champs du modèle
- Afficher les droits d'accès du modèle
- Afficher les règles d'enregistrement du modèle
- Afficher les actions disponibles pour le modèle
- Afficher l'action liée à la vue courante
- Afficher les données de l'enregistrement courant sous forme de JSON

![Barre latérale technique - boutons d'actions](/img/technical-sidebar/record-actions.png)

### Liste des champs et des actions {#fields-and-actions-list}

Les champs et les actions du modèle courant sont listés dans la barre latérale avec quelques informations techniques. Quelques filtres ainsi qu'une barre de recherche sont également disponibles et permettent de trouver rapidement un champ ou une action spécifique.

En survolant un des éléments de la liste, celui-ci sera mis en évidence sur la page, ce qui permet de l'identifier visuellement.

![Barre latérale technique - Hover](/img/technical-sidebar/fields-highlight.png)

### Détails d'un champ ou d'une action {#field-or-action-details}

Il est également possible d'activer un mode permettant de cliquer sur un champ ou une action pour afficher ses détails techniques dans la barre latérale. Cela permet d'obtenir des informations de ce champ ou action uniquement.

Ce mode est activable en cliquant sur le bouton d'inspection situé en haut à droite de la barre latérale.

![Barre latérale technique - mode d'inspection](/img/technical-sidebar/field-selected.png)
