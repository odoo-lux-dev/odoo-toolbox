---
sidebar_position: 3
title: Fonctionnalités supplémentaires
---

# Fonctionnalités supplémentaires

Cette page regroupe les petits utilitaires qu'Odoo Toolbox ajoute à l'interface Odoo.SH pour faciliter la gestion quotidienne des projets et des branches. Ces fonctionnalités sont disponibles directement sur [Odoo.SH](https://www.odoo.sh), sans configuration particulière.

## Raccourcis pour les branches {#branch-shortcuts}

![Raccourcis pour les branches](/img/odoosh/additional-features/shortcuts.png)

### Copie du nom de branche {#branch-name-copy}

Sur la page d'un projet Odoo.SH, chaque branche dispose d'un bouton de copie rapide qui place son nom exact dans le presse-papiers en un clic. Pratique pour les commandes `git checkout`, les messages de commit ou les noms de tâches.

<!-- ![Copie du nom de branche](/img/odoosh/additional-features/branch-copy.png) -->

### Liens GitHub {#github-links}

Odoo Toolbox ajoute des liens directs vers GitHub à côté de chaque branche. Un clic vous emmène vers la branche correspondante dans votre dépôt GitHub, sans avoir à quitter Odoo.SH ni à chercher manuellement dans GitHub.

<!-- ![Liens GitHub](/img/odoosh/additional-features/github-links.png) -->

### Intégration des tâches {#task-integration}

Odoo Toolbox peut associer une branche Odoo.SH à une tâche dans votre projet Odoo. Lorsqu'une correspondance est détectée dans le nom de la branche, un lien direct vers la tâche est affiché à côté de la branche.

#### Fonctionnement

L'extension analyse le nom de chaque branche à l'aide de l'expression régulière `/-(\d+)-/`. L'identifiant numérique capturé est ensuite injecté dans une URL personnalisable via le placeholder `{{task_id}}`. La regex et l'URL sont toutes deux configurables dans les options de l'extension.

Le pattern par défaut correspond au format : `VERSION-TASKID-DESCRIPTION_OPTIONNELLE`

Exemples de noms de branche reconnus : `17.0-12345-my-feature`, `15.0-6789-fixes`

Pour configurer l'URL cible, rendez-vous dans les **options de l'extension** et renseignez votre URL avec le placeholder `{{task_id}}`. Par exemple :

```
https://mon-odoo.com/odoo/project/task/{{task_id}}
```

:::tip
L'URL peut également être définie individuellement par favori depuis la page **SH Favorites** des options de l'extension.
:::

## Indicateurs d'état des builds adaptés aux daltoniens {#colorblind-build-status}

Par défaut, Odoo.SH indique l'état des builds uniquement par des couleurs (vert, rouge, orange). Odoo Toolbox enrichit ces indicateurs avec des icônes et des formes distinctes, rendant les états lisibles même sans distinction des couleurs.

| État       | Indicateur visuel                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Succès     | <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#28a745" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>                                                                                                                                                                                                                          |
| Échec      | <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc3545" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>                                                                                                                                                                                                         |
| En cours   | <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 12-8.373 8.373a1 1 0 1 1-3-3L12 9"/><path d="m18 15 4-4"/><path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5"/></svg> |
| En attente | <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 2 20 20"/><path d="M8.35 2.69A10 10 0 0 1 21.3 15.65"/><path d="M19.08 19.08A10 10 0 1 1 4.92 4.92"/></svg>                                                                                                                               |

<!-- ![Indicateurs d'état adaptés aux daltoniens](/img/odoosh/additional-features/colorblind-status.png) -->

:::tip
Cette fonctionnalité est particulièrement utile si vous utilisez Odoo.SH sur un moniteur mal calibré ou dans un environnement avec un fort éclairage ambiant.
:::
