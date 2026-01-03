# 📁 GANTT FEATURE - CURRENT STRUCTURE

> Clean, organized, standalone package structure

Last updated: January 3, 2026

---

## 📂 Root Level Files

```
gantt/
├── START_HERE.md                   ⭐ Bắt đầu từ đây!
├── README.md                       📚 Main documentation
├── INTEGRATION_GUIDE.md            📖 Step-by-step integration
├── RESTRUCTURE_SUMMARY.md          📝 Tổng quan thay đổi
├── ARCHITECTURE_DIAGRAM.md         🏗️ Architecture diagrams  
├── FOLDER_STRUCTURE.md             📋 Folder structure details
├── config.example.ts               ⚙️ Configuration example
├── index.ts                        📦 Main exports (Public API)
└── migrate-ui-components.sh        🔧 Migration script
```

---

## 📁 Source Folders

### Core Infrastructure

```
📁 adapters/                        🔌 Dependency Injection
   └── index.ts                     - Interface definitions
                                    - configureGantt()
                                    - Adapter types

📁 types/                           📋 Type Definitions
   ├── task.types.ts                - Task, TaskDependency, TaskPriority
   ├── allocation.types.ts          - TaskAllocation, AllocationWithEmployee
   └── gantt.types.ts               - CustomColumn, TimelineColumn, TaskBarDimensions

📁 services/                        💾 Data Access Layer
   ├── interfaces/                  - Service contracts
   │   ├── task.interface.ts
   │   ├── allocation.interface.ts
   │   └── settings.interface.ts
   ├── api/                         - Real Supabase services
   │   ├── task.service.ts
   │   ├── allocation.service.ts
   │   └── settings.service.ts
   ├── mocks/                       - Mock implementations
   │   ├── task.mock.ts
   │   ├── allocation.mock.ts
   │   └── data/
   └── factory.ts                   - Service switcher (real/mock)

📁 store/                           🗄️ State Management (Zustand)
   ├── slices/                      - State slices
   │   ├── view-slice.ts
   │   ├── task-slice.ts
   │   └── ui-slice.ts
   ├── gantt.store.ts               - Combined store
   └── gantt.selector.ts            - Memoized selectors

📁 hooks/                           🪝 React Hooks
   ├── queries/                     - React Query (data fetching)
   │   ├── useTaskQueries.ts
   │   ├── useAllocationQueries.ts
   │   └── useSettingQueries.ts
   ├── mutations/                   - Data mutations
   │   ├── useTaskMutations.ts
   │   └── useAllocationMutations.ts
   ├── ui/                          - UI interactions
   │   ├── useGanttDnd.ts
   │   ├── useGanttScroll.ts
   │   └── useGanttZoom.ts
   ├── useGanttCalculations.ts      - Business logic
   ├── useGanttTimeline.ts
   ├── useGanttState.ts
   ├── useGanttHandlers.ts
   ├── useDatePosition.ts
   ├── useTaskDateRange.ts
   ├── useTaskFilters.ts
   ├── useTaskHierarchy.ts
   ├── useTimelineColumns.ts
   ├── useWorkingDays.ts
   └── index.ts                     - Hook exports

📁 lib/                             🛠️ Utility Functions
   ├── date-utils.ts                - Date calculations
   ├── tree-utils.ts                - Tree operations (WBS, hierarchy)
   └── gantt-utils.ts               - Gantt-specific utils
```

### UI Components

```
📁 components/                      🎨 React Components
   ├── bars/                        - Task visualization
   │   ├── TaskBar.tsx
   │   ├── ProgressBar.tsx
   │   ├── MilestoneDiamond.tsx
   │   └── DependencyLine.tsx
   ├── columns/                     - Grid columns
   │   ├── columns-def.tsx
   │   ├── TaskGrid.tsx
   │   ├── TaskListTable.tsx
   │   ├── TaskRow.tsx
   │   └── index.ts
   ├── timeline/                    - Timeline rendering
   │   ├── ChartArea.tsx
   │   ├── GanttPanels.tsx
   │   ├── TimelineGrid.tsx
   │   ├── TimelineHeader.tsx
   │   └── TimeMarker.tsx
   ├── toolbar/                     - Controls & filters
   │   ├── GanttToolbar.tsx
   │   ├── ViewModeSelector.tsx
   │   ├── FilterControls.tsx
   │   └── index.ts
   ├── dialogs/                     - Modal dialogs
   │   ├── CreateTaskDialog.tsx
   │   ├── TaskDetailDialog.tsx
   │   ├── BaselineManagerDialog.tsx
   │   ├── MilestoneDialog.tsx
   │   ├── LabelSettingsDialog.tsx
   │   ├── StatusSettingsDialog.tsx
   │   ├── ViewSettingsDialog.tsx
   │   └── index.ts
   ├── GanttChart.tsx               - Main chart component
   ├── GanttPanels.tsx              - Layout panels
   └── index.ts                     - Component exports

📁 pages/                           📄 Page Components
   ├── GanttView.tsx                - Main page (entry point)
   ├── GanttChart.tsx               - Alternative page
   ├── GanttChart.refactored.tsx
   ├── GanttChart.tsx.backup
   └── index.ts

📁 context/                         🔄 React Context
   └── GanttContext.tsx             - Context provider (optional)
```

### Documentation

```
📁 docs/                            📚 Documentation
   └── archive/                     - Old documentation files
       ├── 00-START-HERE.md
       ├── ARCHITECTURE_IMPLEMENTATION_SUMMARY.md
       ├── CHECKLIST.md
       ├── CLEANUP_ANALYSIS.md
       ├── CODE_OPTIMIZATION_GUIDE.md
       ├── ... (20+ archived files)
       ├── README.old.md
       └── index.old.ts
```

---

## 📊 Statistics

- **Total Folders**: 18
- **Core Infrastructure**: 6 folders (adapters, types, services, store, hooks, lib)
- **UI Components**: 5 folders (bars, columns, timeline, toolbar, dialogs)
- **Documentation**: 7 main files + 25+ archived files
- **TypeScript Files**: 100+ files
- **Total Lines**: ~15,000 lines of code

---

## 🎯 Key Design Patterns

### 1. Feature-Sliced Design
```
gantt/
├── types/      ← Contracts
├── services/   ← Data
├── store/      ← State
├── hooks/      ← Logic
├── components/ ← UI
└── pages/      ← Entry
```

### 2. Adapter Pattern
```typescript
// External dependencies injected via adapters
configureGantt({
  database: { supabaseClient },
  ui: { Button, Input, ... },
  utils: { cn, toast },
  auth: { user, isLoading }
});
```

### 3. Service-Repository
```typescript
// Data access abstracted
ganttService.task.getTasks(projectId)
ganttService.allocation.getByTask(taskId)
```

### 4. Separation of Concerns
- **Types**: Pure type definitions
- **Services**: Data access only
- **Hooks**: Business logic only
- **Components**: UI rendering only
- **Store**: Client state only

---

## 📦 Public API (index.ts)

### Exports Overview

```typescript
// Configuration
export { configureGantt, getGanttConfig }

// Types
export type { Task, TaskAllocation, CustomColumn, ... }

// Services
export { ganttService, isUsingMockData }

// Store
export { useGanttStore, ganttSelectors }

// Hooks
export { 
  useGetTasks, useCreateTask,        // Queries
  useGanttScroll, useGanttZoom,      // UI
  useGanttCalculations, ...          // Logic
}

// Components
export { GanttView, GanttChart, GanttToolbar, ... }

// Utilities
export { buildTaskTree, calculateWBS, ... }
```

---

## 🔄 Data Flow

```
User Interaction
       ↓
  Components
       ↓
    Hooks (Business Logic)
       ↓
  Services (Data Layer)
       ↓
   Supabase
       ↓
React Query Cache
       ↓
Zustand Store (UI State)
       ↓
  Components (Re-render)
```

---

## 🎨 Styling Approach

- **Tailwind CSS** for utility classes
- **shadcn/ui** for base components
- **CSS Variables** for theming
- **Responsive** design patterns

---

## 🧪 Testing Strategy

```
gantt/
├── services/
│   └── mocks/              ← Mock data & services
├── hooks/
│   └── __tests__/          ← Hook tests
└── components/
    └── __tests__/          ← Component tests
```

Enable mock mode: `VITE_USE_MOCK=true`

---

## 📋 Integration Requirements

### Required
- React 18+
- TypeScript 5+
- @tanstack/react-query
- zustand
- date-fns
- @supabase/supabase-js
- @dnd-kit/core

### Recommended
- Tailwind CSS
- shadcn/ui
- lucide-react
- sonner

---

## 🚀 Quick Reference

| Need | File |
|------|------|
| Start here | [START_HERE.md](./START_HERE.md) |
| Integration | [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) |
| Configuration | [config.example.ts](./config.example.ts) |
| API Reference | [README.md](./README.md) |
| Interfaces | [adapters/index.ts](./adapters/index.ts) |
| Exports | [index.ts](./index.ts) |

---

## ✅ Quality Metrics

- ✅ **Type Safety**: 100% TypeScript, no `any` types
- ✅ **Modularity**: Clear separation of concerns
- ✅ **Testability**: Mock services available
- ✅ **Portability**: Standalone, no hard dependencies
- ✅ **Documentation**: Comprehensive guides
- ✅ **Performance**: Optimized rendering & queries
- ✅ **Maintainability**: Clean architecture

---

**Last updated**: January 3, 2026  
**Status**: ✅ Production Ready
