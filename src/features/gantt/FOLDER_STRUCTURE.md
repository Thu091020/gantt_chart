# 📚 Cấu Trúc Folder Chuẩn - Features/Gantt

## Tổng Quan

Theo **Service-Repository + Feature-Sliced Design**, cấu trúc folder `features/gantt/` được tổ chức theo nguyên tắc:

```
features/gantt/
├── types/              # Type Definitions (Contracts)
├── services/           # Data Layer (API + Mock)
├── store/             # Global State (Zustand)
├── hooks/             # Business Logic & Data Fetching
├── lib/               # Utility Functions
├── components/        # UI Components (Presentation)
├── pages/             # Page Components (Routes)
└── context/           # React Context (Optional)
```

---

## 📁 Chi Tiết Từng Folder

### 1. **types/** - Type Definitions (Định Nghĩa Kiểu Dữ Liệu)

**Mục đích**: Định nghĩa toàn bộ interfaces và types để component, services, hooks tham khảo.

```
types/
├── task.types.ts          # Task, TaskStatus, TaskLabel interfaces
├── allocation.types.ts    # Allocation interface
└── gantt.types.ts         # Gantt-specific: CustomColumn, TaskBarLabels
```

**Nguyên tắc**:
- ✅ Chỉ chứa type definitions, không chứa logic
- ✅ Các services, components import từ đây
- ✅ Tất cả types phải typed đầy đủ (không dùng `any`)

---

### 2. **services/** - Data Layer (Tầng Dữ Liệu)

**Mục đích**: Quản lý nơi dữ liệu lấy từ đâu (Supabase hay Mock). Components không biết.

```
services/
├── interfaces/
│   ├── task.interface.ts           # ITaskService contract
│   ├── allocation.interface.ts
│   └── settings.interface.ts
├── api/
│   ├── task.service.ts            # TaskService with Supabase
│   ├── allocation.service.ts
│   └── settings.service.ts
├── mocks/
│   ├── index.ts                   # Export mock services
│   ├── task.mock.ts               # Mock TaskService
│   ├── allocation.mock.ts
│   └── data/
│       ├── mock-tasks.ts          # Hardcoded data
│       └── mock-allocations.ts
└── factory.ts                      # Switch Real/Mock dựa env
```

**Nguyên tắc**:
- ✅ `factory.ts` quyết định export Real hay Mock dựa `VITE_USE_MOCK`
- ✅ Services implement interfaces
- ✅ Mocks có cùng signature với Real services
- ✅ Components chỉ gọi thông qua hooks, không trực tiếp gọi services

**Ví dụ**:
```typescript
// services/factory.ts
const useRealServices = !import.meta.env.VITE_USE_MOCK;

export const ganttService = {
  task: useRealServices ? taskService : mockTaskService,
  allocation: useRealServices ? allocationService : mockAllocationService,
};
```

---

### 3. **store/** - Global State (Zustand)

**Mục đích**: Quản lý global state (view settings, selected task, expanded state).

```
store/
├── slices/
│   ├── view-slice.ts      # zoomLevel, scrollPosition, dateRange
│   ├── task-slice.ts      # selectedTaskId, expandedTaskIds
│   └── ui-slice.ts        # Dialog open/close states
├── gantt.store.ts         # Combine slices thành 1 hook useGanttStore
└── gantt.selectors.ts     # Selector functions để avoid re-render
```

**Nguyên tắc**:
- ✅ Chỉ store client-side state, không server data
- ✅ Dùng selectors để tối ưu re-render
- ✅ Persist settings vào localStorage

---

### 4. **hooks/** - Business Logic & Data Fetching

**Mục đích**: Cầu nối giữa UI (components) và Data (services/store).

```
hooks/
├── queries/
│   ├── useTaskQueries.ts         # useGetTasks, queries logic
│   ├── useAllocationQueries.ts   # useGetAllocations
│   └── useSettingQueries.ts      # useGetSettings
├── mutations/
│   ├── useTaskMutations.ts       # useAddTask, useUpdateTask, etc
│   ├── useAllocationMutations.ts
│   └── index.ts                  # Export tất cả mutations
├── ui/
│   ├── useGanttScroll.ts         # Scroll synchronization logic
│   ├── useGanttZoom.ts           # Zoom level calculation
│   ├── useGanttDnd.ts            # Drag & drop logic
│   └── index.ts
├── useGanttCalculations.ts       # 🆕 WBS, task hierarchy, working days
├── useGanttTimeline.ts           # 🆕 Timeline column generation
├── useGanttState.ts              # 🆕 Component state (expanded, selected)
├── useGanttHandlers.ts           # 🆕 Event handlers
└── index.ts                      # Export all hooks
```

**Nguyên tắc**:
- ✅ `queries/` = useQuery (React Query)
- ✅ `mutations/` = useMutation (React Query)
- ✅ `ui/` = UI logic hooks (không fetch)
- ✅ Custom hooks để tách logic
- ✅ Components không chứa business logic

**Ví dụ useGanttCalculations**:
```typescript
const { 
  taskIdMap,           // Map taskId → number
  wbsMap,              // Map taskId → "1.1.1"
  flatTasks,           // Tasks sau khi flatten
  filteredFlatTasks,   // Tasks sau filter
  isNonWorkingDay,     // Kiểm tra ngày làm việc
} = useGanttCalculations({ tasks, holidays, settings, expandedTasks });
```

---

### 5. **lib/** - Utility Functions (Không State, Không Side Effects)

**Mục đích**: Pure functions cho calculations, string processing, etc.

```
lib/
├── date-utils.ts        # addWorkingDays, countWorkingDays, isHoliday
├── tree-utils.ts        # buildTaskTree, flattenTree, getDescendants
├── gantt-utils.ts       # getDateX (date → pixel), calculateDuration
└── (more utils as needed)
```

**Nguyên tắc**:
- ✅ Pure functions (no side effects)
- ✅ No hooks, no React import
- ✅ Reusable across features

---

### 6. **components/** - UI Components (Presentation Only)

**Mục đích**: Hiển thị UI, nhận data từ props, không chứa business logic.

```
components/
├── bars/
│   ├── TaskBar.tsx              # Main task bar on timeline
│   ├── MilestoneDiamond.tsx      # Milestone marker
│   ├── ProgressBar.tsx           # Progress indicator
│   └── DependencyLine.tsx        # Dependency connector lines
│
├── columns/
│   ├── TaskListTable.tsx         # Left side table
│   ├── TaskRow.tsx               # Single task row
│   └── columns-def.tsx           # Column definitions
│
├── dialogs/
│   ├── CreateTaskDialog.tsx      # Add task form
│   ├── TaskDetailDialog.tsx      # Edit task form
│   ├── BaselineManagerDialog.tsx # Baseline management
│   ├── LabelSettingsDialog.tsx   # Label colors
│   ├── StatusSettingsDialog.tsx  # Status settings
│   ├── MilestoneDialog.tsx       # Milestone creation
│   └── ViewSettingsDialog.tsx    # View options
│
├── timeline/
│   ├── ChartArea.tsx            # Main chart area
│   ├── TimelineHeader.tsx        # Date header
│   ├── TimelineGrid.tsx          # Grid background
│   ├── TimeMarker.tsx            # Today marker
│   └── GanttPanels.tsx          # Resizable panels
│
└── toolbar/
    ├── GanttToolbar.tsx          # Main toolbar
    ├── ViewModeSelector.tsx      # Day/Week/Month dropdown
    └── FilterControls.tsx        # Filter controls
```

**Nguyên tắc**:
- ✅ Chỉ chứa JSX rendering
- ✅ Logic tách ra hooks
- ✅ Nhận tất cả data từ props
- ✅ Callback từ props, không tự call services
- ✅ Styling với Tailwind

**Bad (Logic in Component)**:
```typescript
export function TaskBar({ task }) {
  const [isEditing, setIsEditing] = useState(false);  // ❌ State logic
  const duration = task.end - task.start;             // ❌ Calculation
  
  const handleSave = async () => {                    // ❌ API call
    const result = await services.updateTask(task);
  };
  
  return <div>{duration} days</div>;
}
```

**Good (Pure Component)**:
```typescript
export function TaskBar({ task, duration, onSave }) {
  return (
    <div 
      onClick={() => onSave(task)}  // ✅ Callback via props
      className="..."
    >
      {duration} days             {/* ✅ Data from props */}
    </div>
  );
}
```

---

### 7. **pages/** - Page Components

**Mục đích**: Main component orchestrating tất cả (hooks, state, components).

```
pages/
├── GanttChart.tsx           # Main Gantt page - Orchestrator
└── GanttChart.backup.tsx    # Backup của old implementation
```

**Nguyên tắc**:
- ✅ Sử dụng tất cả hooks (queries, mutations, state, ui)
- ✅ Tổ chức data flow
- ✅ Pass props xuống components
- ✅ Handle tất cả callbacks

---

### 8. **context/** - React Context (Optional)

**Mục đích**: Share state giữa components mà không cần Zustand.

```
context/
└── GanttContext.tsx    # Optional: Dark mode, theme, etc
```

---

## 🔄 Data Flow (Theo Chuẩn)

```
pages/GanttChart.tsx (Orchestrator)
    ↓
    ├─→ hooks/queries (React Query) ←→ services/factory ←→ API/Mock
    ├─→ hooks/useGanttCalculations  ←→ lib/utils
    ├─→ hooks/useGanttState         ←→ store/
    └─→ components/* (Presentation)
         ↓
         └─→ Callback → pages → hooks → services
```

---

## ✅ Kiểm Tra Chuẩn

Trước khi commit, đảm bảo:

- [ ] **types/** có tất cả TypeScript interfaces
- [ ] **services/** có factory pattern switch Real/Mock
- [ ] **hooks/** không chứa JSX
- [ ] **components/** chỉ nhận props, không có logic
- [ ] **lib/** chỉ pure functions
- [ ] **pages/** orchestrate hooks + components
- [ ] Zero `any` types
- [ ] Zero `@/hooks/*` imports trong components (dùng props thay)
- [ ] Tất cả components export vào `index.ts`

---

## 🎯 Quick Refactoring Checklist

Khi refactor từ old `components/gantt/` sang cấu trúc mới:

1. **Extract types** → `types/`
2. **Extract services** → `services/`
3. **Extract state** → `store/` + `hooks/useGanttState`
4. **Extract calculations** → `hooks/useGanttCalculations` + `lib/`
5. **Extract UI logic** → `hooks/ui/`
6. **Delete business logic** từ components
7. **Add props** cho components
8. **Test** mỗi layer độc lập

---

## 📖 References

- [Feature-Sliced Design](https://feature-sliced.design/)
- [React Query](https://tanstack.com/query/latest)
- [Zustand](https://docs.pmnd.rs/zustand/)
- [Service-Repository Pattern](https://martinfowler.com/articles/ead.html)
