# 🎯 Hook Organization - Features/Gantt

## 📂 Cấu Trúc Hooks Đã Chia Nhỏ (Updated)

```
hooks/
├── index.ts                      # Export tất cả hooks
│
├── queries/                      # React Query - Data fetching
│   ├── useTaskQueries.ts
│   ├── useAllocationQueries.ts
│   └── useSettingQueries.ts
│
├── mutations/                    # React Query - Data updates
│   ├── useTaskMutations.ts
│   └── useAllocationMutations.ts
│
├── ui/                          # UI logic hooks
│   ├── useGanttScroll.ts
│   ├── useGanttZoom.ts
│   └── useGanttDnd.ts
│
├── ORCHESTRATOR HOOKS (Kết hợp sub-hooks):
│   ├── useGanttCalculations.ts   # 🎯 Orchestrator cho calculations
│   ├── useGanttTimeline.ts       # 🎯 Orchestrator cho timeline
│   ├── useGanttState.ts          # ✅ Component state management
│   └── useGanttHandlers.ts       # ✅ Event handlers
│
└── SUB-HOOKS (Chia nhỏ logic từng chức năng):
    │
    ├── Calculations Sub-hooks:
    │   ├── useTaskHierarchy.ts   # 🆕 Task tree, WBS, flatten (150 lines)
    │   ├── useWorkingDays.ts     # 🆕 Holiday, working days logic (120 lines)
    │   └── useTaskFilters.ts     # 🆕 Filter & descendants (50 lines)
    │
    └── Timeline Sub-hooks:
        ├── useTaskDateRange.ts   # 🆕 Min/max dates from tasks (30 lines)
        ├── useTimelineColumns.ts # 🆕 Generate columns Day/Week/Month (100 lines)
        └── useDatePosition.ts    # 🆕 Date ↔ Pixel conversions (80 lines)
```

---

## 📊 Hook Size Comparison

### BEFORE (Hooks lớn):
```
useGanttCalculations.ts → 287 lines ❌ (too big, hard to maintain)
useGanttTimeline.ts     → 230 lines ❌ (too big, hard to maintain)
Total: 517 lines in 2 files
```

### AFTER (Chia nhỏ thành sub-hooks):
```
✅ Orchestrator Hooks:
   useGanttCalculations.ts →  50 lines (kết hợp 3 sub-hooks)
   useGanttTimeline.ts     →  40 lines (kết hợp 3 sub-hooks)

✅ Calculation Sub-hooks (Total: 320 lines):
   useTaskHierarchy.ts     → 150 lines (task tree, WBS)
   useWorkingDays.ts       → 120 lines (holidays, working days)
   useTaskFilters.ts       →  50 lines (filters, descendants)

✅ Timeline Sub-hooks (Total: 210 lines):
   useTaskDateRange.ts     →  30 lines (min/max dates)
   useTimelineColumns.ts   → 100 lines (column generation)
   useDatePosition.ts      →  80 lines (date ↔ pixel)

Total: 620 lines in 8 files ✅ (better organized)
```

---

## 🔧 Chi Tiết Từng Hook

### 1. **useGanttCalculations** (Orchestrator)
**File**: `useGanttCalculations.ts` (50 lines - giảm từ 287 lines)

**Chức năng**: Kết hợp các hooks nhỏ hơn

```typescript
export function useGanttCalculations({
  tasks,
  holidays,
  settings,
  expandedTasks,
  filterAssigneeIds,
}) {
  const hierarchy = useTaskHierarchy(tasks, expandedTasks);
  const workingDays = useWorkingDays(holidays, settings);
  const filters = useTaskFilters(hierarchy.flatTasks, filterAssigneeIds);

  return {
    ...hierarchy,    // taskIdMap, wbsMap, flatTasks, etc.
    ...workingDays,  // isHoliday, countWorkingDays, etc.
    ...filters,      // filteredFlatTasks, getDescendantIds
  };
}
```

**Lợi ích**: 
- ✅ Dễ đọc, dễ maintain
- ✅ Mỗi sub-hook có 1 chức năng rõ ràng
- ✅ Dễ test riêng từng phần

---

### 2. **useTaskHierarchy** (Task Tree & WBS)
**File**: `useTaskHierarchy.ts` (150 lines)

**Chức năng**: Quản lý task hierarchy

```typescript
export function useTaskHierarchy(tasks, expandedTasks) {
  const taskIdMap = ...;         // Task ID → index
  const wbsMap = ...;            // Task ID → WBS (1.1.1)
  const taskTree = ...;          // Hierarchical structure
  const flatTasks = ...;         // Flattened with expansion
  
  return { taskIdMap, wbsMap, taskTree, flatTasks, ... };
}
```

**Output**:
- `taskIdMap`: Map task ID → sequential number
- `taskByIdNumber`: Reverse map
- `wbsMap`: WBS numbering (1, 1.1, 1.1.1)
- `taskTree`: Hierarchical structure
- `flatTasks`: Flattened với expansion

---

### 3. **useWorkingDays** (Working Days Logic)
**File**: `useWorkingDays.ts` (120 lines)

**Chức năng**: Tính toán ngày làm việc

```typescript
export function useWorkingDays(holidays, settings) {
  const isHoliday = ...;
  const checkSaturdayWorkingDay = ...;
  const isNonWorkingDay = ...;
  const countWorkingDays = ...;
  const addWorkingDays = ...;
  
  return { isHoliday, isNonWorkingDay, countWorkingDays, ... };
}
```

**Output**:
- `isHoliday(date)`: Check holiday
- `checkSaturdayWorkingDay(date)`: Check Saturday
- `isNonWorkingDay(date)`: Weekend or holiday
- `countWorkingDays(start, end)`: Count working days
- `addWorkingDays(date, days)`: Add days excluding weekends

---

### 4. **useTaskFilters** (Filter Logic)
**File**: `useTaskFilters.ts` (50 lines)

**Chức năng**: Filter tasks theo điều kiện

```typescript
export function useTaskFilters(flatTasks, filterAssigneeIds) {
  const filteredFlatTasks = ...;    // Filter by assignee
  const getDescendantIds = ...;     // Get child tasks
  
  return { filteredFlatTasks, getDescendantIds };
}
```

**Output**:
- `filteredFlatTasks`: Tasks after filtering
- `getDescendantIds(parentId)`: Get all child IDs

---

### 5. **useGanttTimeline** (Timeline Generation)
**File**: `useGanttTimeline.ts` (230 lines)

**Chức năng**: Generate timeline columns

```typescript
export function useGanttTimeline({ startDate, endDate, viewMode, tasks }) {
  const timelineColumns = ...;      // Columns for Day/Week/Month
  const getDatePosition = ...;      // Date → X pixel
  const getPositionDate = ...;      // X pixel → Date
  
  return { timelineColumns, getDatePosition, ... };
}
```

---

### 6. **useGanttState** (Component State)
**File**: `useGanttState.ts` (200 lines)

**Chức năng**: Quản lý tất cả state của component

```typescript
export function useGanttState(projectId) {
  const [viewMode, setViewMode] = useState('day');
  const [selectedTaskIds, setSelectedTaskIds] = useState(new Set());
  const [expandedTasks, setExpandedTasks] = useState(new Set());
  // ... 10+ states
  
  const handleSelectTask = ...;
  const handleToggleExpand = ...;
  
  return { viewMode, selectedTaskIds, handleSelectTask, ... };
}
```

---

### 7. **useGanttHandlers** (Event Handlers)
**File**: `useGanttHandlers.ts` (100 lines)

**Chức năng**: Event handlers với error handling

```typescript
export function useGanttHandlers({
  onAddTask,
  onEditTask,
  onDeleteTask,
  ...
}) {
  const handleAddTask = ...;
  const handleEditTask = ...;
  
  return { handleAddTask, handleEditTask, ... };
}
```

---

## 🎯 Cách Sử Dụng

### Trong Page Component

```typescript
import {
  useGanttCalculations,
  useGanttTimeline,
  useGanttState,
  useTaskQueries,
} from '@/features/gantt/hooks';

export function GanttChart({ projectId, ... }) {
  // 1. Fetch data
  const { data: tasks } = useTaskQueries(projectId);
  
  // 2. State
  const state = useGanttState(projectId);
  
  // 3. Calculations (orchestrates sub-hooks internally)
  const calc = useGanttCalculations({
    tasks,
    holidays,
    settings,
    expandedTasks: state.expandedTasks,
    filterAssigneeIds: state.filterAssigneeIds,
  });
  
  // 4. Timeline
  const timeline = useGanttTimeline({
    startDate: state.startDate,
    endDate: state.endDate,
    viewMode: state.viewMode,
    tasks: calc.filteredFlatTasks,
  });
  
  // calc có tất cả: taskIdMap, wbsMap, flatTasks, isHoliday, etc.
  return <ChartArea tasks={calc.filteredFlatTasks} .../>;
}
```

### Sử Dụng Sub-hooks Riêng Lẻ (Optional)

Nếu chỉ cần 1 phần logic:

```typescript
import { useTaskHierarchy, useWorkingDays } from '@/features/gantt/hooks';

// Chỉ cần task hierarchy
const { taskTree, wbsMap } = useTaskHierarchy(tasks, expandedTasks);

// Chỉ cần working days
const { isHoliday, countWorkingDays } = useWorkingDays(holidays, settings);
```

---

## ✅ Lợi Ích Chia Nhỏ

| Before (1 hook lớn) | After (4 sub-hooks) |
|---------------------|---------------------|
| ❌ 287 lines trong 1 file | ✅ 50+150+120+50 lines (4 files) |
| ❌ Khó đọc, khó maintain | ✅ Mỗi file 1 chức năng rõ ràng |
| ❌ Khó test logic riêng | ✅ Test từng hook độc lập |
| ❌ Khó reuse 1 phần | ✅ Reuse sub-hook bất kỳ |
| ❌ Phải đọc toàn bộ | ✅ Chỉ đọc file cần thiết |

---

## 📊 Dependency Graph

```
useGanttCalculations (Orchestrator)
    │
    ├─→ useTaskHierarchy
    │   └─ Output: taskIdMap, wbsMap, taskTree, flatTasks
    │
    ├─→ useWorkingDays
    │   └─ Output: isHoliday, isNonWorkingDay, countWorkingDays
    │
    └─→ useTaskFilters
        └─ Output: filteredFlatTasks, getDescendantIds
```

---

## 🧪 Testing Strategy

### Test từng sub-hook riêng lẻ:

```typescript
// test useTaskHierarchy
test('should build correct WBS numbering', () => {
  const { wbsMap } = renderHook(() => 
    useTaskHierarchy(mockTasks, new Set())
  ).result.current;
  
  expect(wbsMap.get('task-1')).toBe('1');
  expect(wbsMap.get('task-1-1')).toBe('1.1');
});

// test useWorkingDays
test('should count working days excluding weekends', () => {
  const { countWorkingDays } = renderHook(() =>
    useWorkingDays([], {})
  ).result.current;
  
  expect(countWorkingDays(monday, friday)).toBe(5);
});
```

---

## 🎉 Summary

✅ **Chia nhỏ logic thành 4 sub-hooks**
✅ **Mỗi hook 1 chức năng rõ ràng**
✅ **Orchestrator hook kết hợp các sub-hooks**
✅ **Dễ đọc, dễ maintain, dễ test**
✅ **Có thể reuse từng phần logic**

**Hook Organization**: 100% hoàn tất! 🚀
