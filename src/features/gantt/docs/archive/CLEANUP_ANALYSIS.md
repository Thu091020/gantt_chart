# 🔍 CLEANUP ANALYSIS - File Thừa & Logic Cần Tách Nhỏ

**Ngày**: January 3, 2026  
**Status**: 🔴 **Cần Cleanup - 3 vấn đề chính**

---

## 📋 Tóm Tắt Vấn Đề

| #   | Vấn Đề                        | Mức Độ      | Hành Động                           |
| --- | ----------------------------- | ----------- | ----------------------------------- |
| 1   | **Duplicate GanttPanels.tsx** | 🔴 Critical | Xóa version cũ tại `components/`    |
| 2   | **3 Files trong pages/ thừa** | 🔴 Critical | Giữ GanttView.tsx, xóa 2 files khác |
| 3   | **GanttView.tsx quá lớn**     | 🟠 High     | Tách 2973 dòng thành 5-7 files nhỏ  |

---

## 🗂️ VẤN ĐỀ 1: Duplicate GanttPanels.tsx

### Hiện tượng

Có **2 file GanttPanels.tsx**:

```
❌ components/GanttPanels.tsx (210 dòng)
❌ components/timeline/GanttPanels.tsx (186 dòng)
```

### Root Cause

Khi di chuyển files từ `components/gantt/`, được tạo ở 2 vị trí:

- Một bản copy vào `components/` (gốc)
- Một bản khác vào `components/timeline/`

### Giải Pháp

```
✅ GIỮ: components/GanttPanels.tsx (210 dòng - bản chính)
❌ XÓA: components/timeline/GanttPanels.tsx (trùng lặp)
```

**Lý do**:

- File gốc tại `components/GanttPanels.tsx` import đúng từ `pages/GanttView`
- File tại `components/timeline/GanttPanels.tsx` có import sai (relative path)
- GanttPanels không phải component timeline, nó là layout container chứa timeline

---

## 🗂️ VẤN ĐỀ 2: 3 Files Thừa trong pages/

### Hiện tượng

```
📁 pages/
├─ GanttChart.tsx (59 dòng) ⚠️ Temporary wrapper
├─ GanttChart.refactored.tsx (219 dòng) ⚠️ Alternative version
├─ GanttChart.tsx.backup (Backup file) ❌ Thừa
├─ GanttView.tsx (2973 dòng) ✅ Main component
└─ index.ts
```

### Chi Tiết Từng File

#### **GanttChart.tsx** (59 dòng)

```tsx
// Hiện tại: Chỉ là wrapper
export { GanttView as GanttChart } from './GanttView';
export type { GanttViewMode } from '../components/toolbar/GanttToolbar';

// + Có comments TODO về migration (lỗi thời)
```

**Đánh giá**:

- ❌ Không cần thiết (GanttView đủ rồi)
- ❌ Gây nhầm lẫn (tên GanttChart nhưng là export GanttView)
- ❌ Làm thư mục rối

---

#### **GanttChart.refactored.tsx** (219 dòng)

```tsx
// Đây là phiên bản "cải tiến" sử dụng hooks mới
import {
  useGanttCalculations,
  useGanttTimeline,
  useGanttState,
} from '../../hooks';
import {
  useTaskQueries,
  useAllocationQueries,
  useSettingQueries,
} from '../../hooks';

export function GanttChart({
  projectId,
  projectMembers,
  holidays,
  settings,
}: GanttChartProps) {
  const { data: tasks = [] } = useTaskQueries(projectId);
  const { data: allocations = [] } = useAllocationQueries(projectId);
  const state = useGanttState(projectId);
  // ... 200 dòng khác
}
```

**Đánh giá**:

- ❌ Không được sử dụng (chỉ là draft/experiment)
- ❌ Có import error (references to old hook structure)
- ❌ Gây confusion cho dev mới (cái nào cái thật?)
- ✅ Nhưng... có ý tưởng tốt về refactoring

---

#### **GanttChart.tsx.backup** (Unknown size)

```
❌ Rõ ràng là backup file
❌ Version control đã giải quyết (dùng git, không cần .backup)
```

**Đánh giá**: Xóa ngay

---

### Giải Pháp Khuyến Cáo

```
✅ GIỮ: pages/GanttView.tsx (2973 dòng - production)
❌ XÓA: pages/GanttChart.tsx (59 dòng - wrapper vô dụng)
❌ XÓA: pages/GanttChart.tsx.backup (backup file)
⚠️ MOVE: pages/GanttChart.refactored.tsx → docs/REFACTORING_IDEAS.md
```

**Lý do**:

- GanttView là file chính, đủ dùng
- Không cần wrapper (GanttChart → GanttView)
- Refactored version có ý tưởng tốt nhưng chưa hoàn chỉnh → để tài liệu tham khảo

---

## 🗂️ VẤN ĐỀ 3: GanttView.tsx Quá Lớn (2973 dòng)

### Thống Kê Hiện Tại

```
📊 GanttView.tsx: 2973 dòng
   ├─ Imports: ~80 dòng
   ├─ Interfaces & Types: ~50 dòng
   ├─ Constants (DEFAULT_COLUMNS): ~300 dòng
   ├─ Component Function: ~1500 dòng
   ├─ State declarations: ~200 dòng
   ├─ Event handlers: ~800 dòng
   └─ Return JSX: ~43 dòng
```

### Vấn Đề

1. **Khó maintain** - Tìm function/state rất lâu
2. **Khó test** - 2973 dòng logic = khó viết unit test
3. **Khó refactor** - Đổi một thứ dễ break cái khác
4. **Không reusable** - Logic bị gom trong 1 component

---

## 🔨 Phương Án Tách Logic GanttView.tsx

### A. Tách Constants (300 dòng)

**File mới**: `src/features/gantt/lib/gantt-constants.ts`

```typescript
// ✅ Chứa tất cả const không thay đổi
export const DEFAULT_COLUMNS = [...]
export const DEFAULT_TASK_BAR_LABELS = {...}
export const SAMPLE_TASKS = [...] // Nếu có
```

**Benefit**:

- GanttView.tsx sẽ nhẹ 300 dòng
- Constants dễ update tập trung ở 1 file
- Tái sử dụng được ở file khác

---

### B. Tách Event Handlers (800 dòng)

**File mới**: `src/features/gantt/hooks/useGanttHandlers.ts`

```typescript
interface UseGanttHandlersProps {
  projectId: string;
  tasks: Task[];
  allocations: Allocation[];
  // ... all state setters
}

export function useGanttHandlers({
  projectId,
  tasks,
  setEditingTask,
  setShowAddDialog,
  // ... others
}: UseGanttHandlersProps) {

  // ✅ Tất cả event handlers: handleAddTask, handleEditTask, etc
  const handleAddTask = useCallback(() => { ... }, []);
  const handleEditTask = useCallback((task) => { ... }, []);
  const handleDeleteTask = useCallback((taskId) => { ... }, []);
  const handleTaskDateChange = useCallback((taskId, newStart, newEnd) => { ... }, []);
  const handleExpandTask = useCallback((taskId) => { ... }, []);
  const handleSelectTask = useCallback((taskId, multiSelect) => { ... }, []);

  return {
    handleAddTask,
    handleEditTask,
    handleDeleteTask,
    handleTaskDateChange,
    handleExpandTask,
    handleSelectTask,
    // ... etc
  };
}
```

**Benefit**:

- Handlers có thể test riêng
- Logic tách khỏi component (cleaner)
- Tái sử dụng được ở hook khác

---

### C. Tách State Management (200 dòng state + 100 dòng useEffect)

**File mới**: `src/features/gantt/hooks/useGanttState.ts`

```typescript
export interface GanttState {
  viewMode: GanttViewMode;
  startDate: Date;
  endDate: Date;
  editingTask: Task | null;
  showAddDialog: boolean;
  showBaselineDialog: boolean;
  expandedTasks: Set<string>;
  selectedTaskIds: Set<string>;
  columns: CustomColumn[];
  taskBarLabels: TaskBarLabels;
  // ... etc
}

export function useGanttState(projectId: string): {
  state: GanttState;
  setState: (updates: Partial<GanttState>) => void;
  // ... setters
} {

  const [viewMode, setViewMode] = useState<GanttViewMode>('day');
  const [startDate, setStartDate] = useState(() => subWeeks(new Date(), 1));
  const [endDate, setEndDate] = useState(() => addMonths(new Date(), 2));

  // ✅ Load settings effect
  useEffect(() => { ... }, [viewSettings]);

  return {
    state: { viewMode, startDate, endDate, ... },
    setState: (updates) => {
      if ('viewMode' in updates) setViewMode(updates.viewMode);
      // ... etc
    },
    setViewMode,
    setStartDate,
    // ... all setters
  };
}
```

**Benefit**:

- State tập trung ở 1 hook
- Dễ add/remove state properties
- Side effects (useEffect) có logic đúng

---

### D. Tách Query & Mutation Logic (150 dòng)

**File**: `src/features/gantt/hooks/useGanttData.ts`

```typescript
export function useGanttData(projectId: string) {
  // ✅ Tất cả data fetching
  const { data: tasks = [] } = useTasks(projectId);
  const { data: allocations = [] } = useAllocations(projectId);
  const { data: taskStatuses = [] } = useTaskStatuses(projectId);
  const { data: taskLabels = [] } = useTaskLabels(projectId);
  const { data: projectMilestones = [] } = useProjectMilestones(projectId);
  const { data: viewSettings } = useViewSettings();

  // ✅ Tất cả mutations
  const addTask = useAddTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const bulkUpdateTasks = useBulkUpdateTasks();
  const bulkSetAllocations = useBulkSetAllocations();

  return {
    tasks,
    allocations,
    taskStatuses,
    taskLabels,
    projectMilestones,
    viewSettings,
    addTask,
    updateTask,
    deleteTask,
    bulkUpdateTasks,
    bulkSetAllocations,
  };
}
```

**Benefit**:

- Data layer tách riêng
- Dễ mock để test
- Reusable ở component khác

---

### E. Component Chính Refactored (300-400 dòng)

**GanttView.tsx sau tách**:

```typescript
import { useRef } from 'react';
import { GanttPanels, GanttPanelsHandle } from '../components/GanttPanels';
import { useGanttData } from './hooks/useGanttData';
import { useGanttState } from './hooks/useGanttState';
import { useGanttHandlers } from './hooks/useGanttHandlers';
import { DEFAULT_COLUMNS, DEFAULT_TASK_BAR_LABELS } from '../lib/gantt-constants';

interface GanttViewProps {
  projectId: string;
  projectMembers: { id: string; name: string }[];
  holidays: Holiday[];
  settings: any;
}

export function GanttView({
  projectId,
  projectMembers,
  holidays,
  settings,
}: GanttViewProps) {
  // ✅ Data fetching
  const {
    tasks,
    allocations,
    taskStatuses,
    taskLabels,
    projectMilestones,
    viewSettings,
    addTask,
    updateTask,
    deleteTask,
  } = useGanttData(projectId);

  // ✅ State management
  const { state, setViewMode, setStartDate, ... } = useGanttState(projectId);

  // ✅ Event handlers
  const {
    handleAddTask,
    handleEditTask,
    handleDeleteTask,
    handleTaskDateChange,
    handleExpandTask,
  } = useGanttHandlers({
    projectId,
    tasks,
    state,
    setEditingTask: (task) => { ... },
    // ... all state setters
  });

  // ✅ Calculations (keep complex logic if needed)
  const flatTasks = useMemo(() => {
    const tree = buildTaskTree(tasks);
    return flattenTaskTree(tree, state.expandedTasks);
  }, [tasks, state.expandedTasks]);

  const timelineColumns = useMemo(() => {
    return generateTimelineColumns(state.startDate, state.endDate, state.viewMode);
  }, [state.startDate, state.endDate, state.viewMode]);

  // ✅ Compact JSX - chỉ khoảng 100 dòng
  return (
    <div className="gantt-view">
      <GanttToolbar
        viewMode={state.viewMode}
        onViewModeChange={setViewMode}
        onAddTask={handleAddTask}
      />
      <GanttPanels
        ref={ganttPanelsRef}
        flatTasks={flatTasks}
        columns={state.columns}
        taskStatuses={taskStatuses}
        onTaskDateChange={handleTaskDateChange}
        onExpandTask={handleExpandTask}
        // ... etc
      />
      <CreateTaskDialog
        open={state.showAddDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowAddDialog(false);
            setEditingTask(null);
          }
        }}
        // ... etc
      />
    </div>
  );
}
```

**Benefit**:

- GanttView.tsx: 2973 → ~350 dòng ✅
- Mỗi hook chuyên về 1 việc
- Dễ test, dễ maintain, dễ refactor

---

## 📊 Summary Sau Cleanup

### Trước Cleanup

```
pages/
├─ GanttChart.tsx ❌
├─ GanttChart.refactored.tsx ❌
├─ GanttChart.tsx.backup ❌
├─ GanttView.tsx (2973 dòng) ⚠️ Quá lớn
└─ index.ts

components/
├─ GanttPanels.tsx ✅
├─ timeline/
│  └─ GanttPanels.tsx ❌ Trùng lặp
```

### Sau Cleanup

```
pages/
├─ GanttView.tsx (350 dòng) ✅ Gọn gàng
└─ index.ts

components/
├─ GanttPanels.tsx ✅
└─ timeline/
   ├─ ChartArea.tsx
   ├─ TimelineHeader.tsx
   ├─ TimelineGrid.tsx
   ├─ TimeMarker.tsx
   └─ (GanttPanels.tsx REMOVED)

hooks/
├─ useGanttData.ts (NEW - 60 dòng)
├─ useGanttState.ts (NEW - 150 dòng)
├─ useGanttHandlers.ts (NEW - 300 dòng)
├─ index.ts
├─ queries/
├─ mutations/
└─ ui/

lib/
├─ gantt-constants.ts (NEW - 300 dòng)
├─ date-utils.ts
├─ gantt-utils.ts
└─ tree-utils.ts
```

### File Xóa

- ❌ `pages/GanttChart.tsx`
- ❌ `pages/GanttChart.refactored.tsx`
- ❌ `pages/GanttChart.tsx.backup`
- ❌ `components/timeline/GanttPanels.tsx`

### File Tạo Mới

- ✅ `hooks/useGanttData.ts`
- ✅ `hooks/useGanttState.ts`
- ✅ `hooks/useGanttHandlers.ts`
- ✅ `lib/gantt-constants.ts`

---

## 🎯 Action Plan

### Phase 1: Cleanup (15 phút)

1. Xóa `pages/GanttChart.tsx`
2. Xóa `pages/GanttChart.refactored.tsx`
3. Xóa `pages/GanttChart.tsx.backup`
4. Xóa `components/timeline/GanttPanels.tsx`
5. Verify imports still work

### Phase 2: Extract Constants (10 phút)

1. Tạo `lib/gantt-constants.ts`
2. Move DEFAULT_COLUMNS từ GanttView → constants
3. Move DEFAULT_TASK_BAR_LABELS → constants
4. Update GanttView imports
5. Test

### Phase 3: Extract State (20 phút)

1. Tạo `hooks/useGanttState.ts`
2. Move tất cả useState từ GanttView → hook
3. Move tất cả useEffect từ GanttView → hook
4. Update GanttView để dùng hook
5. Test

### Phase 4: Extract Handlers (30 phút)

1. Tạo `hooks/useGanttHandlers.ts`
2. Move tất cả event handlers → hook
3. Update GanttView
4. Test

### Phase 5: Extract Data (15 phút)

1. Tạo `hooks/useGanttData.ts`
2. Move tất cả queries/mutations → hook
3. Update GanttView
4. Test

### Phase 6: Test & Verify (10 phút)

1. Build project
2. Run dev server
3. Test Gantt chart functionality
4. No import errors

---

## ⏱️ Tổng Thời Gian: ~90 phút

**Tôi có thể thực hiện toàn bộ cleanup + refactor này cho bạn ạ!**  
Bạn muốn bắt đầu ngay không?

---

**Được tạo bởi**: AI Assistant  
**Ngày**: January 3, 2026  
**Status**: 🔴 **Chờ xác nhận**
