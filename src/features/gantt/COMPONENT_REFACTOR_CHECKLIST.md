# ✅ Component Refactoring Checklist

## 📋 Overview

**Current Status**: 🔴 Components chứa business logic, imports sai, code duplicate

**Target**: ✅ Pure UI components, imports đúng, logic trong hooks

---

## 🎯 Phase 1: Fix Imports (CRITICAL - 1 hour)

### ❌ Sai → ✅ Đúng

```diff
# ChartArea.tsx
- import { Task } from '@/hooks/useTasks';
+ import { Task } from '../../types/task.types';

- import { GanttViewMode } from './GanttToolbar';
+ import { GanttViewMode } from '../../hooks/useGanttTimeline';

# TaskListTable.tsx  
- import { Task } from '@/hooks/useTasks';
+ import { Task } from '../../types/task.types';

- import { CustomColumn } from './GanttView';
+ import { CustomColumn } from '../../types/gantt.types';

- import { TaskStatus } from '@/hooks/useTaskStatuses';
+ import { TaskStatus } from '../../types/task.types';

- import { TaskLabel } from '@/hooks/useTaskLabels';
+ import { TaskLabel } from '../../types/task.types';

# CreateTaskDialog.tsx
- import { Task } from '@/hooks/useTasks';
+ import { Task } from '../../types/task.types';

- import { useHolidays, Holiday } from '@/hooks/useHolidays';
+ import { Holiday } from '../../types/task.types';
+ // Dùng useHolidays từ src/hooks/ (global hook)

# GanttPanels.tsx
- import { Task } from '@/hooks/useTasks';
+ import { Task } from '../../types/task.types';

- import { TaskStatus } from '@/hooks/useTaskStatuses';
+ import { TaskStatus } from '../../types/task.types';
```

### Files to Fix:
- [ ] `components/timeline/ChartArea.tsx` - Fix 2 imports
- [ ] `components/columns/TaskListTable.tsx` - Fix 4 imports  
- [ ] `components/dialogs/CreateTaskDialog.tsx` - Fix 2 imports
- [ ] `components/timeline/GanttPanels.tsx` - Fix 2 imports
- [ ] `components/dialogs/StatusSettingsDialog.tsx` - Fix 1 import
- [ ] `components/toolbar/GanttToolbar.tsx` - Remove type export

---

## 🎯 Phase 2: Remove Duplicate Logic (HIGH - 2 hours)

### 1. CreateTaskDialog.tsx ❌ Duplicate Working Days Logic

**Current** (BAD):
```tsx
// ❌ 55+ lines duplicate code
function isHoliday(date: Date, holidays: Holiday[]): boolean { ... }
function countWorkingDays(...): number { ... }
function addWorkingDays(...): Date { ... }
```

**Target** (GOOD):
```tsx
// ✅ Use hook
import { useWorkingDays } from '../../hooks';

function CreateTaskDialog() {
  const { isHoliday, countWorkingDays, addWorkingDays } = useWorkingDays(holidays, settings);
  // Use directly, no duplicate!
}
```

**Tasks**:
- [ ] Xóa 3 functions: `isHoliday`, `countWorkingDays`, `addWorkingDays`
- [ ] Import và dùng `useWorkingDays` hook
- [ ] Test dialog vẫn hoạt động đúng

### 2. ChartArea.tsx ❌ Duplicate Date Position Logic

**Current** (BAD):
```tsx
// ❌ 70+ lines calculation logic IN component
const getDatePosition = useMemo(() => {
  const columnPositions = [];
  // ... complex calculation
  return (date: Date): number => { ... };
}, [timelineColumns]);
```

**Target** (GOOD):
```tsx
// ✅ Receive from props (calculated by hook)
interface ChartAreaProps {
  getDatePosition: (date: Date) => number;  // From useDatePosition hook
}
```

**Tasks**:
- [ ] Xóa `getDatePosition` useMemo trong component
- [ ] Nhận `getDatePosition` từ props
- [ ] Parent component dùng `useDatePosition` hook

### 3. TaskListTable.tsx ❌ State Management in Component

**Current** (BAD):
```tsx
// ❌ 10+ useState for editing
const [editingCell, setEditingCell] = useState(...);
const [editValue, setEditValue] = useState('');
const [datePickerOpen, setDatePickerOpen] = useState(...);
const [assigneePopoverOpen, setAssigneePopoverOpen] = useState(...);
// ... 6 more states
```

**Target** (GOOD):
```tsx
// ✅ Extract to hook
import { useTableEditing } from '../../hooks/useTableEditing';

function TaskListTable() {
  const editing = useTableEditing();
  // editing.cell, editing.startEdit, editing.saveEdit, etc.
}
```

**Tasks**:
- [ ] Tạo `hooks/useTableEditing.ts` hook
- [ ] Di chuyển 10 states vào hook
- [ ] Component nhận state từ hook

---

## 🎯 Phase 3: Implement Missing Components (MEDIUM - 2 hours)

### TaskBar.tsx ❌ Empty File

**Current**: File rỗng (0 bytes)

**Target**:
```tsx
// ✅ Pure UI component
export function TaskBar({
  task,
  startX,
  width,
  labels,
  isSelected,
  onClick,
}: TaskBarProps) {
  return (
    <div
      className="task-bar"
      style={{ left: startX, width }}
      onClick={onClick}
    >
      {labels.showName && <span>{task.name}</span>}
      {/* ... render task bar */}
    </div>
  );
}
```

**Tasks**:
- [ ] Implement TaskBar component (50-80 lines)
- [ ] Implement ProgressBar component
- [ ] Implement MilestoneDiamond component
- [ ] Implement DependencyLine component

---

## 🎯 Phase 4: Split Large Components (LOW - 3 hours)

### GanttToolbar.tsx (636 lines) → Split into Sub-components

**Current**: 1 file quá lớn

**Target**: Chia thành 3-4 components

```
toolbar/
├── GanttToolbar.tsx (150 lines) - Main orchestrator
├── ViewModeSelector.tsx (50 lines) - Already exists!
├── FilterControls.tsx (100 lines) - Already exists!
├── ActionButtons.tsx (80 lines) - NEW
└── DateRangeControls.tsx (60 lines) - NEW
```

**Tasks**:
- [ ] Tạo ActionButtons.tsx (Add, Edit, Delete, etc.)
- [ ] Tạo DateRangeControls.tsx (Date pickers)
- [ ] Refactor GanttToolbar dùng sub-components
- [ ] Reduce GanttToolbar từ 636 → 150 lines

---

## 📊 Expected Results

| Metric | Before | After | Status |
|--------|--------|-------|--------|
| **Imports sai** | 8+ files | 0 files | 🔴 TODO |
| **Duplicate logic** | 3 places | 0 places | 🔴 TODO |
| **Empty components** | TaskBar.tsx | Implemented | 🔴 TODO |
| **Large components** | GanttToolbar 636 lines | <200 lines | 🔴 TODO |
| **Logic in components** | Yes (useMemo, useCallback) | No (pure UI) | 🔴 TODO |

---

## ⏱️ Time Estimate

| Phase | Tasks | Time | Priority |
|-------|-------|------|----------|
| **Phase 1** | Fix imports | 1 hour | 🔴 CRITICAL |
| **Phase 2** | Remove duplicates | 2 hours | 🔴 HIGH |
| **Phase 3** | Implement missing | 2 hours | 🟡 MEDIUM |
| **Phase 4** | Split large | 3 hours | 🟢 LOW |
| **TOTAL** | - | **8 hours** | - |

---

## 🚀 Quick Start Guide

### Bắt đầu ngay (30 phút):

```bash
# 1. Fix imports nhanh nhất
# Chạy find & replace trong VSCode:

Find:    import { Task } from '@/hooks/useTasks';
Replace: import { Task } from '../../types/task.types';

Find:    import { TaskStatus } from '@/hooks/useTaskStatuses';
Replace: import { TaskStatus } from '../../types/task.types';

Find:    import { TaskLabel } from '@/hooks/useTaskLabels';
Replace: import { TaskLabel } from '../../types/task.types';

# 2. Xóa duplicate code trong CreateTaskDialog
# Dòng 16-60: Xóa 3 functions, dùng useWorkingDays hook

# 3. Commit ngay
git add .
git commit -m "🔧 Fix: Component imports và remove duplicate logic"
```

---

## ✅ Completion Criteria

Component refactoring hoàn tất khi:

- [ ] ✅ Tất cả imports đúng (không còn `@/hooks/use...` trong features/gantt/components)
- [ ] ✅ Không còn duplicate logic (dùng hooks thay vì copy code)
- [ ] ✅ TaskBar.tsx đã implement
- [ ] ✅ Components < 300 lines
- [ ] ✅ Components chỉ chứa UI logic (render, events)
- [ ] ✅ Business logic ở hooks
- [ ] ✅ Zero TypeScript errors
- [ ] ✅ All components có props interface rõ ràng

---

**Next Action**: Bắt đầu Phase 1 - Fix imports (1 hour) 🚀
