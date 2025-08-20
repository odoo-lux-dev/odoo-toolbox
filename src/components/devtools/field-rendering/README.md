# DevTools Components Architecture

## 🏗 Overview

The DevTools components architecture follows a clear logical hierarchy:

```
📊 result-viewer.tsx         → Main interface (table/list modes)
   ├── 📋 record-renderer.tsx   → Record collection rendering
   └── 🔍 field-rendering/      → Field rendering system
       ├── field-renderer.tsx      → Main orchestrator 
       ├── value-renderer.tsx      → Visual value rendering
       ├── simple-field-renderer.tsx     → Non-relational fields
       ├── empty-relational-field-renderer.tsx → Empty relational fields
       ├── relational-field-renderer.tsx → Relational fields with data
       └── record-field-renderer.tsx     → Fields within records
```

## 📋 Detailed Responsibilities

### 🔝 **Interface Level**

#### `result-viewer.tsx`
- **Role**: Main user interface
- **Responsibilities**:
  - Display mode management (table/list)
  - Pagination and navigation
  - Control interface (buttons, filters)
  - DevTools context coordination

### 📊 **Collection Level**

#### `record-renderer.tsx`
- **Role**: Record collection rendering
- **Responsibilities**:
  - Display of record lists/tables
  - Expansion/collapse management
  - Context menu coordination
  - Column header management

### 🔍 **Field Level** (`field-rendering/`)

#### `field-renderer.tsx` - **Orchestrator**
- **Role**: Entry point and routing
- **Responsibilities**:
  - Field type analysis (relational vs simple)
  - Routing to appropriate specialized renderer
  - Field metadata management

#### `value-renderer.tsx` - **Visual rendering**
- **Role**: Formatted value display
- **Responsibilities**:
  - Visual formatting (colors, styles)
  - Primitive type handling (string, number, boolean)
  - Recursive rendering of objects/arrays
  - Appropriate CSS class application

#### `simple-field-renderer.tsx` - **Basic fields**
- **Role**: Non-relational field rendering
- **Responsibilities**:
  - String, number, boolean, date fields
  - ValueRenderer application with classes
  - Basic context menu management

#### `empty-relational-field-renderer.tsx` - **Empty relations**
- **Role**: Empty relational field rendering
- **Responsibilities**:
  - "false" display for empty relations
  - Tooltip with relation metadata
  - Context menu for empty relations

#### `relational-field-renderer.tsx` - **Active relations**
- **Role**: Relational field rendering with data
- **Responsibilities**:
  - Expansion/collapse interface
  - Asynchronous loading of related data
  - Recursion via RecordRenderer
  - Loading/error state management

#### `record-field-renderer.tsx` - **Record orchestrator**
- **Role**: Renderer selection for field within record
- **Responsibilities**:
  - Relational vs non-relational analysis
  - Routing to appropriate specialized renderer
  - Context menu unification

## 🔄 Data Flow

```
1. result-viewer.tsx
   ↓ (records[])
2. record-renderer.tsx
   ↓ (field by field)
3. record-field-renderer.tsx
   ↓ (routing decision)
4a. simple-field-renderer.tsx → value-renderer.tsx
4b. relational-field-renderer.tsx → record-renderer.tsx (recursion)
4c. empty-relational-field-renderer.tsx → value