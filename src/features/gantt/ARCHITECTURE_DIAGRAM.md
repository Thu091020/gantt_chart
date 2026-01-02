# 📊 Architecture Diagram - Features/Gantt

## 1. Folder Structure Tree

```
📦 features/gantt/
│
├─── 📄 index.ts                    [Central exports]
│
├─── 📁 types/                      [Type Definitions]
│    ├─ task.types.ts              Task, TaskStatus, TaskLabel
│    ├─ allocation.types.ts        Allocation interface
│    └─ gantt.types.ts             CustomColumn, TaskBarLabels
│
├─── 📁 services/                   [Data Layer]
│    ├─ factory.ts                 ⚙️ Switch Real/Mock
│    ├─ interfaces/
│    │  ├─ task.interface.ts      ITaskService contract
│    │  ├─ allocation.interface.ts
│    │  └─ settings.interface.ts
│    ├─ api/
│    │  ├─ task.service.ts        Supabase implementation
│    │  ├─ allocation.service.ts
│    │  └─ settings.service.ts
│    └─ mocks/
│       ├─ task.mock.ts           Mock implementation
│       ├─ allocation.mock.ts
│       └─ data/
│          ├─ mock-tasks.ts       Hardcoded data
│          └─ mock-allocations.ts
│
├─── 📁 store/                      [Global State - Zustand]
│    ├─ slices/
│    │  ├─ view-slice.ts          Zoom, scroll, dates
│    │  ├─ task-slice.ts          Selected, expanded tasks
│    │  └─ ui-slice.ts            Dialog states
│    ├─ gantt.store.ts            Combined store
│    └─ gantt.selector.ts         Selectors (optimize re-render)
│
├─── 📁 hooks/                      [Business Logic]
│    ├─ useGanttCalculations.ts   🆕 Task hierarchy, WBS, filters
│    ├─ useGanttTimeline.ts       🆕 Timeline generation
│    ├─ useGanttState.ts          🆕 Component state management
│    ├─ useGanttHandlers.ts       🆕 Event handlers
│    │
│    ├─ queries/
│    │  ├─ useTaskQueries.ts      React Query: getTasks
│    │  ├─ useAllocationQueries.ts React Query: getAllocations
│    │  └─ useSettingQueries.ts   React Query: getSettings
│    │
│    ├─ mutations/
│    │  ├─ useTaskMutations.ts    useMutation: add/update/delete tasks
│    │  └─ useAllocationMutations.ts useMutation: allocations
│    │
│    ├─ ui/
│    │  ├─ useGanttScroll.ts      Scroll synchronization
│    │  ├─ useGanttZoom.ts        Zoom calculation
│    │  └─ useGanttDnd.ts         Drag & drop logic
│    │
│    └─ index.ts                   Export all
│
├─── 📁 lib/                        [Pure Utilities - No React]
│    ├─ date-utils.ts             addWorkingDays, countWorkingDays
│    ├─ tree-utils.ts             buildTree, flatten, getDescendants
│    └─ gantt-utils.ts            getDateX, calculateDuration
│
├─── 📁 components/                 [Pure UI - Props Only]
│    ├─ bars/
│    │  ├─ TaskBar.tsx            Main task bar rendering
│    │  ├─ MilestoneDiamond.tsx    Milestone marker
│    │  ├─ ProgressBar.tsx         Progress indicator
│    │  └─ DependencyLine.tsx      Dependency arrows
│    │
│    ├─ columns/
│    │  ├─ TaskListTable.tsx       Left side task table
│    │  ├─ TaskRow.tsx             Single row
│    │  └─ columns-def.tsx         Column definitions
│    │
│    ├─ dialogs/
│    │  ├─ CreateTaskDialog.tsx
│    │  ├─ TaskDetailDialog.tsx
│    │  ├─ BaselineManagerDialog.tsx
│    │  ├─ LabelSettingsDialog.tsx
│    │  ├─ StatusSettingsDialog.tsx
│    │  ├─ MilestoneDialog.tsx
│    │  └─ ViewSettingsDialog.tsx
│    │
│    ├─ timeline/
│    │  ├─ ChartArea.tsx           Main chart container
│    │  ├─ TimelineHeader.tsx       Date header
│    │  ├─ TimelineGrid.tsx         Grid background
│    │  ├─ TimeMarker.tsx           Today marker
│    │  └─ GanttPanels.tsx         Resizable panels
│    │
│    └─ toolbar/
│       ├─ GanttToolbar.tsx        Toolbar container
│       ├─ ViewModeSelector.tsx    Day/Week/Month selector
│       └─ FilterControls.tsx      Filter controls
│
├─── 📁 pages/                      [Main Page - Orchestrator]
│    ├─ GanttChart.tsx             Main page (refactored)
│    ├─ GanttChart.refactored.tsx  Template
│    └─ GanttChart.backup.tsx      Old implementation
│
├─── 📁 context/                    [React Context]
│    └─ GanttContext.tsx           Optional global context
│
└─── 📚 Documentation
     ├─ README.md
     ├─ QUICKSTART.md
     ├─ FOLDER_STRUCTURE.md        ⭐ Chi tiết cấu trúc
     ├─ REFACTORING_COMPLETE.md    ⭐ Changes summary
     ├─ STANDARDIZATION_COMPLETE.md ⭐ How to use
     ├─ STANDALONE_PACKAGE_GUIDE.md
     └─ ARCHITECTURE_DIAGRAM.md    ← You are here
```

---

## 2. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    pages/GanttChart.tsx                         │
│                    (Orchestrator)                                │
└──────────┬──────────────────────────────────────────────────────┘
           │
           ├─────────────────────┬────────────────────┬─────────────────────┐
           │                     │                    │                     │
           ▼                     ▼                    ▼                     ▼
    ┌────────────────┐  ┌─────────────────┐  ┌────────────────┐  ┌──────────────────┐
    │ useGanttState  │  │ useTaskQueries  │  │ useGanttCalc   │  │ useGanttTimeline │
    │ (State Mgmt)   │  │ (Data Fetch)    │  │ (Calculations) │  │ (Timeline Gen)   │
    └────────┬───────┘  └────────┬────────┘  └────────┬───────┘  └────────┬─────────┘
             │                   │                    │                    │
             │ selectedTaskIds   │ tasks              │ flatTasks         │ columns
             │ expandedTasks     │ allocations        │ wbsMap            │ width
             │ viewMode          │ settings           │ isHoliday         │ positions
             │                   │                    │ filters           │
             └────────────────┬──┴──────────────┬─────┴────────┬──────────┘
                              │                │              │
                    ┌─────────▼────────┐       │              │
                    │  services/       │       │              │
                    │  factory.ts      │       │              │
                    │  (Real/Mock)     │       │              │
                    └──────────────────┘       │              │
                              ▲                │              │
                              │                │              │
                         Supabase/Mock         │              │
                                              │              │
                              ┌───────────────▼──────────────▼───────┐
                              │   components/* (Pure UI)             │
                              │                                      │
                              ├─ ChartArea                          │
                              ├─ TaskListTable                      │
                              ├─ TaskBar                            │
                              ├─ TimelineHeader                     │
                              ├─ Dialogs                            │
                              └─ Toolbar                            │
                              └──────────────────────────────────────┘
```

---

## 3. Hook Responsibilities

```
┌─────────────────────────────────────────────────────────────────┐
│                    4 Main Custom Hooks                          │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────┐
│ useGanttCalculations()       │  ⚙️ Pure Calculations
├──────────────────────────────┤
│ Input:                       │
│  • tasks[]                   │
│  • holidays[]                │
│  • expandedTasks Set         │
│  • filterAssigneeIds[]       │
│                              │
│ Output:                      │
│  • taskIdMap                 │  Task ID → index
│  • wbsMap                    │  Task ID → WBS (1.1.1)
│  • taskTree                  │  Hierarchical structure
│  • flatTasks                 │  Flattened with expansion
│  • filteredFlatTasks         │  After filters applied
│  • isNonWorkingDay()         │  Check working days
│  • getDescendantIds()        │  Get child tasks
└──────────────────────────────┘

┌──────────────────────────────┐
│ useGanttTimeline()           │  📅 Timeline Generation
├──────────────────────────────┤
│ Input:                       │
│  • startDate                 │
│  • endDate                   │
│  • viewMode: day/week/month  │
│  • tasks[]                   │
│                              │
│ Output:                      │
│  • timelineColumns           │  Columns with width
│  • totalTimelineWidth        │  Total pixel width
│  • getDatePosition(date)     │  Date → X pixel
│  • getPositionDate(x)        │  X pixel → date
│  • taskDateRange             │  Min/max task dates
└──────────────────────────────┘

┌──────────────────────────────┐
│ useGanttState()              │  🔄 Component State
├──────────────────────────────┤
│ View state:                  │
│  • viewMode                  │  day/week/month
│  • startDate, endDate        │  Calendar range
│  • customViewMode            │  Custom view flag
│                              │
│ Selection state:             │
│  • selectedTaskIds Set       │  Multi-select
│  • expandedTasks Set         │  Expanded tasks
│                              │
│ Dialog state:                │
│  • showAddDialog             │  Create task dialog
│  • editingTask               │  Task being edited
│  • showBaselineDialog        │  Baseline dialog
│                              │
│ Config state:                │
│  • columns[]                 │  Column config
│  • taskBarLabels             │  What to show
│  • filterAssigneeIds[]       │  Filter by assignee
│                              │
│ Handlers:                    │
│  • handleSelectTask()        │
│  • handleToggleExpand()      │
│  • handleColumnsChange()     │
│  • handleTaskBarLabelsChange()
└──────────────────────────────┘

┌──────────────────────────────┐
│ useGanttHandlers()           │  🎯 Event Handlers
├──────────────────────────────┤
│ User interactions:           │
│  • handleAddTask()           │
│  • handleEditTask()          │
│  • handleDeleteTask()        │
│  • handleUpdateField()       │
│  • handleSaveTask()          │
│  • handleSaveSettings()      │
└──────────────────────────────┘

┌──────────────────────────────┐
│ React Query Hooks            │  📡 Data Fetching
├──────────────────────────────┤
│ Queries (Read):              │
│  • useTaskQueries()          │
│  • useAllocationQueries()    │
│  • useSettingQueries()       │
│                              │
│ Mutations (Write):           │
│  • useTaskMutations()        │
│  • useAllocationMutations()  │
└──────────────────────────────┘

┌──────────────────────────────┐
│ UI Logic Hooks               │  🖱️ UI Interactions
├──────────────────────────────┤
│ UI helpers:                  │
│  • useGanttScroll()          │  Scroll sync
│  • useGanttZoom()            │  Zoom calculation
│  • useGanttDnd()             │  Drag & drop
└──────────────────────────────┘
```

---

## 4. Component Layer

```
┌──────────────────────────────────────────────────────────────────┐
│                      pages/GanttChart.tsx                        │
│              (Orchestrates all hooks & components)               │
└──────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
                ▼             ▼             ▼
        ┌──────────────┐ ┌─────────┐ ┌──────────────┐
        │ GanttToolbar │ │ Timeline │ │ TaskListTable│
        │ (Top)        │ │ (Right)  │ │ (Left)       │
        └──────────────┘ └────┬────┘ └──────────────┘
                              │
                ┌─────────────┬┴─────────────┐
                │             │             │
                ▼             ▼             ▼
        ┌────────────┐ ┌────────────┐ ┌──────────────┐
        │TimelineHdr │ │ ChartArea  │ │ TaskRow      │
        │(Dates)     │ │(MainCanvas)│ │ (Rows)       │
        └────────────┘ └─────┬──────┘ └──────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
                ▼             ▼             ▼
        ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
        │ TaskBar      │ │ Milestone    │ │ DependencyLine
        │ (Rendering)  │ │ Diamond      │ │ (SVG)
        └──────────────┘ │ (Rendering)  │ └──────────────┘
                         └──────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                        Dialogs (Modals)                          │
├──────────────────────────────────────────────────────────────────┤
│ • CreateTaskDialog       │ • LabelSettingsDialog               │
│ • TaskDetailDialog       │ • StatusSettingsDialog              │
│ • BaselineManagerDialog  │ • MilestoneDialog                   │
│ • ViewSettingsDialog     │                                     │
└──────────────────────────────────────────────────────────────────┘

All components are PURE (no logic, props only)
```

---

## 5. Service Layer Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     services/factory.ts                          │
│        (Environment-based switching between Real/Mock)           │
└──────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
   VITE_USE_MOCK = true       VITE_USE_MOCK = false
   (Development)              (Production)
                │                           │
                ▼                           ▼
        ┌──────────────┐          ┌──────────────┐
        │ Mock Services│          │ Real Services│
        │ (In-Memory)  │          │ (Supabase)   │
        └──────┬───────┘          └──────┬───────┘
               │                         │
        ┌──────┴─────────┐               │
        │                ▼               ▼
        │    services/   ┌──────────────────────┐
        │    mocks/      │  services/api/       │
        │    ├─task.ts   │  ├─task.service.ts  │
        │    ├─alloc.ts  │  ├─alloc.service.ts │
        │    └─etc       │  └─etc              │
        │                │                     │
        └─────┬──────────┴─────────────────────┘
              │
              │ Implement same interface:
              │ ITaskService
              │ IAllocationService
              │ ISettingsService
              │
              ▼
        ┌──────────────────┐
        │ Hooks (useQuery) │
        │ (Agnostic to     │
        │  Real/Mock)      │
        └──────────────────┘
              │
              ▼
        ┌──────────────────┐
        │   Components     │
        │ (Never know the  │
        │  data source!)   │
        └──────────────────┘
```

---

## 6. State Management

```
┌──────────────────────────────────────────────────────────────────┐
│                      Zustand Store                               │
│                   (Global State)                                 │
└──────────────────────────────────────────────────────────────────┘

                          useGanttStore
                              │
                ┌─────────────┬┴─────────────┐
                │             │             │
                ▼             ▼             ▼
        ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
        │ View Slice   │ │ Task Slice   │ │ UI Slice     │
        │              │ │              │ │              │
        │ • zoomLevel  │ │ • selected   │ │ • dialogs    │
        │ • scroll     │ │ • expanded   │ │ • modals     │
        │ • dateRange  │ │              │ │              │
        └──────────────┘ └──────────────┘ └──────────────┘
                              │
                    ┌─────────▼─────────┐
                    │ Selectors (useMemo)
                    │ Prevent re-render
                    └───────────────────┘
```

---

## 7. Type Safety

```
┌──────────────────────────────────────────────────────────────────┐
│                      TypeScript Types                            │
└──────────────────────────────────────────────────────────────────┘

types/
├─ task.types.ts
│  ├ Task (with children: Task[])
│  ├ TaskStatus
│  └ TaskLabel
│
├─ allocation.types.ts
│  ├ Allocation
│  └ AllocationStatus
│
└─ gantt.types.ts
   ├ ViewMode: 'day' | 'week' | 'month' | 'quarter'
   ├ CustomColumn
   ├ TaskBarLabels
   ├ TimelineColumn
   ├ TaskWithLevel
   └ (Other UI types)

All hooks are fully typed:

useGanttCalculations({
  tasks: Task[],
  holidays: Holiday[],
  settings: Settings,
  expandedTasks: Set<string>,
  filterAssigneeIds: string[],
}): {
  taskIdMap: Map<string, number>,
  wbsMap: Map<string, string>,
  flatTasks: (Task & { level: number })[],
  filteredFlatTasks: (Task & { level: number })[],
  isNonWorkingDay: (date: Date) => boolean,
  ...
}
```

---

## 8. Testing Strategy

```
┌─────────────────────────────────────────────────────────────┐
│              Testing Layers (Bottom-up)                     │
└─────────────────────────────────────────────────────────────┘

Layer 1: Unit Tests (Pure Functions)
  ├─ lib/date-utils.ts
  ├─ lib/tree-utils.ts
  └─ lib/gantt-utils.ts

Layer 2: Hook Tests (useGantt* hooks)
  ├─ hooks/useGanttCalculations.test.ts
  ├─ hooks/useGanttTimeline.test.ts
  ├─ hooks/useGanttState.test.ts
  └─ hooks/useGanttHandlers.test.ts

Layer 3: Component Tests
  ├─ components/bars/TaskBar.test.tsx
  ├─ components/columns/TaskListTable.test.tsx
  └─ etc.

Layer 4: Integration Tests
  └─ pages/GanttChart.integration.test.tsx

Layer 5: E2E Tests
  └─ e2e/gantt.spec.ts
```

---

## 9. Migration Path (Old → New)

```
OLD: src/components/gantt/
  ├─ GanttView.tsx           (2373 lines - LOGIC SOUP)
  ├─ GanttChart.tsx          (532 lines)
  ├─ TaskGrid.tsx            (827 lines)
  └─ (6000+ lines mixed)

           │
           │ REFACTOR
           ▼

NEW: src/features/gantt/
  ├─ pages/GanttChart.tsx    (Orchestrator)
  │  └─ Uses: hooks + components
  │
  ├─ hooks/
  │  ├─ useGanttCalculations (Extract from GanttView)
  │  ├─ useGanttTimeline     (Extract from GanttView)
  │  ├─ useGanttState        (Extract from GanttView)
  │  ├─ useGanttHandlers     (Extract from GanttView)
  │  ├─ queries/             (React Query)
  │  ├─ mutations/           (React Query)
  │  └─ ui/                  (UI logic)
  │
  ├─ components/
  │  ├─ bars/                (Pure rendering)
  │  ├─ columns/             (Pure rendering)
  │  ├─ dialogs/             (Pure rendering)
  │  ├─ timeline/            (Pure rendering)
  │  └─ toolbar/             (Pure rendering)
  │
  ├─ services/               (Data layer)
  │  ├─ factory.ts           (Real/Mock switch)
  │  ├─ api/                 (Supabase)
  │  └─ mocks/               (Mock data)
  │
  ├─ store/                  (Zustand)
  ├─ lib/                    (Utilities)
  ├─ types/                  (TypeScript)
  └─ context/                (React context)
```

---

This architecture ensures:
- ✅ **Separation of Concerns** - Each layer has one job
- ✅ **Testability** - Each layer can be tested independently
- ✅ **Reusability** - Hooks can be reused in other features
- ✅ **Maintainability** - Clear structure & responsibilities
- ✅ **Scalability** - Easy to add new features
- ✅ **Type Safety** - Full TypeScript coverage
