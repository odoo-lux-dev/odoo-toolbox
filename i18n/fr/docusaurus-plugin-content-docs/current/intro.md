---
sidebar_position: 1
title: Démarrage rapide
---

# Démarrage rapide

**Odoo Toolbox** vise à améliorer l'expérience des utilisateurs et développeurs Odoo / Odoo.SH en ajoutant une variété d'outils et de fonctionnalités.

## Installation {#installation}

### Chromium {#chromium}

1. Rendez-vous sur le [Chrome Web Store](https://chromewebstore.google.com/detail/odoo-toolbox/jgobnmpfeomiffhbedhfgbhelcnnelkd)
2. Cliquez sur **Ajouter à Chrome**
3. Confirmez en cliquant sur **Ajouter l'extension**

### Firefox {#firefox}

1. Rendez-vous sur la page [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/odoo-toolbox/)
2. Cliquez sur **Ajouter à Firefox**
3. Confirmez en cliquant sur **Ajouter**

Une fois installée, l'icône Odoo Toolbox apparaît dans la barre d'outils de votre navigateur.

---

## Démarrage rapide {#quick-start}

### 1. Accéder à une instance Odoo {#navigate-to-odoo}

Ouvrez votre navigateur et rendez-vous sur une instance Odoo en **version 14 ou supérieure**.

### 2. Ouvrir la popup {#open-the-popup}

Cliquez sur l'icône **Odoo Toolbox** dans la barre d'outils de votre navigateur pour ouvrir la popup. Depuis celle-ci, vous pouvez :

- Activer ou désactiver le **mode debug** (disponible également via un raccourci clavier)
- Basculer le **thème** de l'extension entre clair et sombre
- Accéder à vos **projets favoris Odoo.SH**
- Ouvrir la **page Options** pour les réglages avancés

### 3. Inspecter les champs avec la barre latérale technique {#inspect-fields}

Sur n'importe quelle vue Odoo, un **bouton flottant** apparaît, par défaut, dans le coin inférieur droit de la page.

1. Cliquez sur le bouton pour ouvrir la **barre latérale technique**
2. Parcourez les différentes informations techniques sur la page actuelle (modèle, champs, vue, etc.)
3. Pour plus de précision, activez le **mode sélection d'élément** en cliquant sur l'icône curseur en haut à droite
4. Cliquez sur n'importe quel champ de la page pour afficher ses détails techniques :
    - Nom du champ (`name`, `partner_id`, ...)
    - Type de champ (`Many2one`, `Char`, `Selection`, ...)
    - Propriétés et métadonnées supplémentaires

### 4. Utiliser le panneau DevTools {#use-devtools-panel}

Le panneau DevTools vous permet d'interagir avec la couche RPC d'Odoo sans quitter votre navigateur.

1. Ouvrez les **DevTools** de votre navigateur (`F12` ou `Ctrl+Shift+I` / `Cmd+Option+I` sur Mac)
2. Naviguez vers l'onglet **Odoo Toolbox**
3. Sélectionnez un onglet d'opération :
    - **Search** - interrogez des enregistrements avec des filtres de domaine et une sélection de champs
    - **Write / Create / Unlink** - modifiez des enregistrements avec une saisie JSON
    - **Call Method** - exécutez n'importe quelle méthode de modèle

---

## Et ensuite ? {#whats-next}

Explorez la documentation de chaque section :

- [Odoo](./odoo/overview) - Contient tous les outils liés aux databases Odoo en général
- [Odoo.SH](./odoosh/overview) - Contient tous les outils liés à Odoo.SH
- [Options](./options) - Aperçu rapide de la page Options pour la configuration de l'extension
