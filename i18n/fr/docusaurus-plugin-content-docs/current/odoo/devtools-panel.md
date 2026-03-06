---
sidebar_position: 4
title: Panneau DevTools
toc_max_heading_level: 4
---

# Panneau DevTools

:::danger Utiliser avec précaution
La plupart des opérations disponibles dans ce panneau (**Création**, **Modification**, **Suppression**, **Appel de méthode**) écrivent directement dans la base de données et sont **irréversibles**. Seule l'opération de **Recherche** est sans danger car elle est en lecture seule.

- Ne jamais exécuter des opérations d'écriture ou de suppression sur une base de production sans en être certain.
- En cas de doute, testez toujours sur une **base de données de test** au préalable.
  :::

Le panneau DevTools est une interface complète de test RPC intégrée directement dans les outils de développement de votre navigateur. Il vous permet d'interroger, créer, modifier, supprimer des enregistrements et d'appeler des méthodes sur n'importe quel modèle Odoo sans quitter votre navigateur.

## Ouvrir le panneau {#opening-the-panel}

1. Ouvrez les DevTools de votre navigateur (<kbd>F12</kbd> ou <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>I</kbd> / <kbd>Cmd</kbd>+<kbd>Option</kbd>+<kbd>I</kbd> sur macOS).
2. Repérez l'onglet **Odoo Toolbox** dans la barre d'onglets des DevTools.
3. Cliquez dessus - le panneau s'ouvre et se connecte automatiquement à la page Odoo courante.

:::info
Si un message d'erreur apparait, assurez-vous d'être sur une page Odoo. Et connecté au backend (pas sur le website).
:::

![Panneau DevTools - vue générale](/img/devtools-panel/overview.png)

## L'interface {#the-interface}

Le panneau est divisé en deux zones principales :

- **Gauche / haut - Constructeur de requête** : c'est ici que vous configurez le modèle, l'opération, le domaine, les champs et le payload.
- **Droite / bas - Visionneuse de réponse** : c'est ici que la réponse JSON s'affiche après exécution.

![Panneau DevTools - vue d'ensemble de l'interface](/img/devtools-panel/interface-overview.png)

### Barre latérale {#sidebar}

Cette barre latérale à gauche contient les champs de saisie pour construire votre requête. Les champs affichés changent en fonction de l'opération sélectionnée (Recherche, Création, Modification, Suppression, Appel de méthode). Tous les champs possibles sont affichés dans l'onglet **Search**, les autres opérations n'affichent que les champs pertinents.

:::info
Même dans un onglet différent de celui de la recherche, vous pouvez remplir cette barre latérale avec les critères disponibles pour ensuite exécuter une nouvelle recherche. Si vous voulez, par exemple, changer les enregistrements sur lesquels vont s'appliquer vos actions.
:::

#### Modèle {#model}

Le champ **Model** attend le nom technique du modèle (ex. `res.partner`, `sale.order`, etc.). Il dispose d'une auto-complétion pour vous aider à trouver le bon modèle.

#### IDs {#ids}

Le champ **Record IDs** attend un tableau JSON d'IDs d'enregistrements (ex. `[1, 2, 3]`) ou une liste séparée par des virgules (ex. `1,2,3`). Il est utilisé pour cibler des enregistrements spécifiques dans les opérations de modification, suppression ou appel de méthode.

#### Sélection de champs {#field-selection}

Le champ **Fields** dispose d'une recherche et d'une liste de champs disponibles pour le modèle. Limiter les champs récupérés rend la réponse plus lisible et l'appel plus rapide.

Laissez le champ vide pour retourner tous les champs du modèle.

#### Filtres de domaine {#domain-filters}

Les domaines suivent la [syntaxe de domaine Odoo](https://www.odoo.com/documentation/master/developer/reference/backend/orm.html#search-domains) standard : un tableau JSON de conditions combinées avec les opérateurs préfixes `&` (ET, par défaut) et `|` (OU).

```odoo-toolbox-docs/i18n/fr/docusaurus-plugin-content-docs/current/odoo/devtools-panel.md#L1-1
[["state", "=", "done"], ["partner_id.country_id.code", "=", "US"]]
```

Le panneau valide le domaine en JSON en temps réel et signale les erreurs de syntaxe avant même que vous n'exécutiez la requête.

:::tip
Utilisez un tableau vide `[]` pour correspondre à tous les enregistrements (équivalent à aucun filtre).
:::

#### Tri et pagination {#sorting-and-pagination}

Le champ **Order By** permet de spécifier le tri des résultats (ex. `name ASC` ou `create_date DESC`). Il dispose d'une recherche et d'une liste de champs disponibles pour le modèle.

Le champ **Limit** permet de limiter le nombre d'enregistrements retournés, et le champ **Offset** permet de sauter un nombre d'enregistrements (pour la pagination).

#### Bouton d'exécution {#execute-button}

Une fois que vous avez configuré votre requête, cliquez sur le bouton **Execute Query** pour l'exécuter. La réponse s'affiche alors dans la zone de droite.

#### Bouton Get Current {#get-current-button}

Le bouton **Get Current** pré-remplit les champs de la barre latérale avec les valeurs correspondant à la vue Odoo courante. Par exemple, si vous êtes sur la fiche d'un partenaire, il remplira le champ **Model** avec `res.partner` et le champ **Record IDs** avec l'ID du partenaire affiché. Si vous avez sélectionné plusieurs enregistrements dans une vue liste, il remplira le champ **Record IDs** avec les IDs de ces enregistrements.

### Visionneuse de réponse {#response-viewer}

Après l'exécution d'un appel, le(s) record(s) répondant aux critères définis s'affiche(nt) dans la zone de réponse.

- Un bouton **Copy** permet de copier la réponse complète dans le presse-papiers, **Download** permet de la télécharger au format JSON.
- Les erreurs retournées par Odoo (ex. droits d'accès, champs manquants) sont affichées avec leur message et leur traceback.

#### Options d'affichage {#display-options}

La réponse s'affiche par défaut sous vue liste. Dans l'onglet **Search**, vous pouvez aussi basculer vers la vue tableau via le bouton situé en haut à droite.

#### Boutons d'action sur les enregistrements {#record-action-buttons}

Dans la vue liste, chaque enregistrement dispose de boutons d'action rapide pour focus l'enregistrement, l'ouvrir dans Odoo ou l'ouvrir dans Odoo mais sous la forme d'une Popup.

| Icone                                        | Action                                                                                                                                                                                                      |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ![Focus](/img/devtools-panel/focus-icon.png) | Focalise l'enregistrement dans le DevTools. Utile pour pouvoir utiliser celui-ci comme point de départ pour faire d'autres opérations (modification, suppression, appel de méthode) sur cet enregistrement. |
| ![Open](/img/devtools-panel/open-icon.png)   | Ouvre l'enregistrement dans Odoo (remplace le contenu de la fenêtre parente)                                                                                                                                |
| ![Popup](/img/devtools-panel/popup-icon.png) | Ouvre l'enregistrement dans une popup Odoo. Utile pour consulter rapidement les détails d'un enregistrement sans perdre le contexte de votre travail de la fenêtre parente.                                 |

## Opérations {#operations}

Utilisez le menu supérieur pour choisir ce que vous souhaitez faire. Chaque opération n'affiche que les champs de saisie qui lui sont pertinents.

### Recherche {#search}

L'opération la plus courante et celle par défaut. Retourne une liste d'enregistrements correspondant aux critères donnés (domaine, modèle...)

:::note Champs de la barre latérale
`Model` · `Record IDs` · `Fields` · `Domain` · `Order By` · `Limit` · `Offset` · `Context`
:::

![Panneau DevTools - Recherche](/img/devtools-panel/search.png)

### Modification {#write}

Modifie les enregistrements existants correspondant aux critères donnés.

:::danger
Cette opération modifie les enregistrements existants dans la base de données. Assurez-vous que les IDs que vous fournissez correspondent bien aux enregistrements que vous souhaitez modifier, et que les valeurs sont correctes. Si vous n'êtes pas certain, testez d'abord sur une base de test.
:::

:::note Champs de la barre latérale
`Model` · `Record IDs` · `Domain` · `Context`
:::

![Panneau DevTools - Modification](/img/devtools-panel/write.png)

### Création {#create}

Crée un enregistrement avec les valeurs données et l'affiche une fois créé.

:::danger
Cette opération crée de nouveaux enregistrements dans la base de données. Assurez-vous que les valeurs que vous fournissez sont correctes et que vous êtes sur une base de test si vous n'êtes pas certain.
:::

:::note Champs de la barre latérale
`Model` · `Context`
:::

![Panneau DevTools - Création](/img/devtools-panel/create.png)

### Appel de méthode {#call-method}

Appelle n'importe quelle méthode publique sur un modèle. Utile pour déclencher de la logique métier, des wizards ou des méthodes personnalisées.

:::note Champs de la barre latérale
`Model` · `Record IDs` · `Domain` · `Context`
:::

![Panneau DevTools - Appel de méthode](/img/devtools-panel/call-method.png)

### Suppression et archivage {#unlink}

(Dés)archive ou supprime les enregistrements correspondants.

:::danger
Cette opération modifie ou supprime les enregistrements existants dans la base de données. Assurez-vous que les IDs que vous fournissez correspondent bien aux enregistrements que vous souhaitez modifier ou supprimer. Si vous n'êtes pas certain, testez d'abord sur une base de test.
:::

:::note Champs de la barre latérale
`Model` · `Record IDs` · `Domain` · `Context`
:::

![Panneau DevTools - Suppression et archivage](/img/devtools-panel/unlink.png)

## Historique des requêtes {#request-history}

Le panneau garde un historique de vos requêtes récentes (dans la limite des 150), accessible via l'onglet **History** dans le menu supérieur. Vous pouvez y retrouver les détails de chaque requête (modèle, domaine, payload, réponse) et les réexécuter ou les copier facilement.

![Panneau DevTools - Onglet Historique](/img/devtools-panel/history-tab.png)
