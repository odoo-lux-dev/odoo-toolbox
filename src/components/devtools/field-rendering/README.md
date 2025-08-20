# DevTools Components Architecture

## 🏗 Vue d'ensemble

L'architecture des composants DevTools suit une hiérarchie logique claire :

```
📊 result-viewer.tsx         → Interface principale (modes table/list)
   ├── 📋 record-renderer.tsx   → Rendu de collections de records
   └── 🔍 field-rendering/      → Système de rendu de champs
       ├── field-renderer.tsx      → Orchestrateur principal 
       ├── value-renderer.tsx      → Rendu visuel des valeurs
       ├── simple-field-renderer.tsx     → Champs non-relationnels
       ├── empty-relational-field-renderer.tsx → Champs relationnels vides
       ├── relational-field-renderer.tsx → Champs relationnels avec données
       └── record-field-renderer.tsx     → Champs dans les records
```

## 📋 Responsabilités détaillées

### 🔝 **Niveau Interface**

#### `result-viewer.tsx`
- **Rôle** : Interface utilisateur principale
- **Responsabilités** :
  - Gestion des modes d'affichage (table/list)
  - Pagination et navigation
  - Interface de contrôle (boutons, filtres)
  - Coordination avec le contexte DevTools

### 📊 **Niveau Collection**

#### `record-renderer.tsx`
- **Rôle** : Rendu de collections de records
- **Responsabilités** :
  - Affichage de listes/tables de records
  - Gestion de l'expansion/contraction
  - Coordination des menus contextuels
  - Gestion des headers de colonnes

### 🔍 **Niveau Champ** (`field-rendering/`)

#### `field-renderer.tsx` - **Orchestrateur**
- **Rôle** : Point d'entrée et routage
- **Responsabilités** :
  - Analyse du type de champ (relationnel vs simple)
  - Routage vers le bon renderer spécialisé
  - Gestion des métadonnées de champ

#### `value-renderer.tsx` - **Rendu visuel**
- **Rôle** : Affichage formaté des valeurs
- **Responsabilités** :
  - Formatage visuel (couleurs, styles)
  - Gestion des types primitifs (string, number, boolean)
  - Rendu récursif des objets/tableaux
  - Application des classes CSS appropriées

#### `simple-field-renderer.tsx` - **Champs basiques**
- **Rôle** : Rendu des champs non-relationnels
- **Responsabilités** :
  - Champs string, number, boolean, date
  - Application du ValueRenderer avec classes
  - Gestion des context menus basiques

#### `empty-relational-field-renderer.tsx` - **Relations vides**
- **Rôle** : Rendu des champs relationnels sans valeur
- **Responsabilités** :
  - Affichage "false" pour relations vides
  - Tooltip avec métadonnées de relation
  - Context menu pour relations vides

#### `relational-field-renderer.tsx` - **Relations actives**
- **Rôle** : Rendu des champs relationnels avec données
- **Responsabilités** :
  - Interface d'expansion/contraction
  - Chargement asynchrone des données liées
  - Récursion via RecordRenderer
  - Gestion des états de loading/error

#### `record-field-renderer.tsx` - **Orchestrateur de record**
- **Rôle** : Choix du renderer pour un champ dans un record
- **Responsabilités** :
  - Analyse relationnel vs non-relationnel
  - Routage vers le bon renderer spécialisé
  - Unification des context menus

## 🔄 Flux de données

```
1. result-viewer.tsx
   ↓ (records[])
2. record-renderer.tsx
   ↓ (field by field)
3. record-field-renderer.tsx
   ↓ (routing decision)
4a. simple-field-renderer.tsx → value-renderer.tsx
4b. relational-field-renderer.tsx → record-renderer.tsx (recursion)
4c. empty-relational-field-renderer.tsx → value-renderer.tsx
```

## 🎯 Avantages de cette architecture

✅ **Séparation claire des responsabilités**
✅ **Maintenance facilitée** - Chaque composant a un rôle précis
✅ **Debugging simplifié** - Plus facile d'identifier où est un problème
✅ **Réutilisabilité** - Composants modulaires
✅ **Extensibilité** - Facile d'ajouter de nouveaux types de rendu
✅ **Testabilité** - Chaque composant peut être testé isolément

## 🔧 Utilisation

Les composants sont utilisés automatiquement via l'orchestrateur principal. Pour étendre :

1. **Nouveau type de champ** → Créer un nouveau renderer dans `field-rendering/`
2. **Nouveau mode d'affichage** → Modifier `result-viewer.tsx` 
3. **Nouvelle fonctionnalité de collection** → Modifier `record-renderer.tsx`
