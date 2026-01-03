# 🔴 Component Issues - Cần Refactor Ngay

## ❌ Vấn Đề Hiện Tại

Components trong `src/features/gantt/components/` vẫn chứa:
1. ❌ **Logic tính toán** (useMemo, useCallback)
2. ❌ **Imports sai** (import từ `@/hooks/...` thay vì local hooks)
3. ❌ **Duplicate code** (logic đã có trong hooks nhưng lại viết lại trong components)
4. ❌ **Vi phạm nguyên tắc**: Components phải chỉ là UI, không chứa business logic

---

## 📊 Chi Tiết Từng Component

### 1. **ChartArea.tsx** (532 lines) ❌❌❌
**Vấn đề nghiêm trọng**:

```tsx
// ❌ Logic tính toán trong component
const getDatePosition = useMemo(() => {
  const columnPositions = [];
  let currentX = 0;
  
  timelineColumns.forEach((col) => {
    columnPositions.push({...});
    currentX += col.width;
  });
  
  return (date: Date): number => {
    // 50+ lines calculation logic
  };
}, [timelineColumns]);

// ❌ Imports sai
import { Task } from '@/hooks/useTasks';  // Sai! Phải dùng '../types/task.types'
import { GanttViewMode } from './GanttToolbar';  // Sai! Phải từ hooks
```

**Logic phải chuyển về**: `useDatePosition` hook (đã tạo rồi!)

**Component phải nhận**:
```tsx
// ✅ Đúng - Pure UI
interface ChartAreaProps {
  tasks: Task[];
  getDatePosition: (date: Date) => number;  // Nhận từ hook
  timelineColumns: TimelineColumn[];         // Data từ bên ngoài
  onSelectTask: (id: string) => void;        // Callback
}
```

---

### 2. **TaskListTable.tsx** (827 lines) ❌❌❌
**Vấn đề nghiêm trọng**:

```tsx
// ❌ Import sai
import { Task } from '@/hooks/useTasks';           // Phải: '../types/task.types'
import { CustomColumn } from './GanttView';        // Phải: '../types/gantt.types'
import { TaskStatus } from '@/hooks/useTaskStatuses';  // Phải: '../types/task.types'
import { TaskLabel } from '@/hooks/useTaskLabels'; // Phải: '../types/task.types'

// ❌ State logic trong component
const [editingCell, setEditingCell] = useState<...>(null);
const [editValue, setEditValue] = useState('');
const [datePickerOpen, setDatePickerOpen] = useState<...>(null);
const [assigneePopoverOpen, setAssigneePopoverOpen] = useState<...>(null);

// ❌ Business logic
const startEdit = (taskId: string, field: string, value: any) => {
  setEditingCell({ taskId, field });
  setEditValue(String(value));
};
```

**Logic phải chuyển về**: `useTableEditing` hook (cần tạo mới)

**Component phải nhận**:
```tsx
// ✅ Đúng - Pure UI
interface TaskListTableProps {
  tasks: Task[];
  columns: CustomColumn[];
  editingCell: { taskId: string; field: string } | null;
  onStartEdit: (taskId: string, field: string) => void;
  onSaveEdit: (taskId: string, field: string, value: any) => void;
}
```

---

### 3. **CreateTaskDialog.tsx** (481 lines) ❌❌❌
**Vấn đề nghiêm trọng**:

```tsx
// ❌ Import sai
import { Task } from '@/hooks/useTasks';
import { useHolidays, Holiday } from '@/hooks/useHolidays';

// ❌ Logic tính toán working days TRONG component (duplicate!)
function isHoliday(date: Date, holidays: Holiday[]): boolean {
  // 20+ lines logic
}

function countWorkingDays(startDate: Date, endDate: Date, holidays: Holiday[]): number {
  // 15+ lines logic
}

function addWorkingDays(startDate: Date, workingDays: number, holidays: Holiday[]): Date {
  // 20+ lines logic
}
```

**Logic đã có trong**: `useWorkingDays` hook! Không cần viết lại!

**Component phải dùng**:
```tsx
// ✅ Đúng
import { useWorkingDays } from '../hooks';

function CreateTaskDialog() {
  const { countWorkingDays, addWorkingDays, isHoliday } = useWorkingDays(holidays, settings);
  // Dùng functions từ hook, không viết lại!
}
```

---

### 4. **GanttToolbar.tsx** (636 lines) ❌❌
**Vấn đề**:

```tsx
// ❌ Export type sai chỗ
export type GanttViewMode = 'day' | 'week' | 'month';  // Phải export từ hooks!
export type { TaskBarLabels } from '@/hooks/useViewSettings';

// ⚠️ Component quá lớn (636 lines)
// Phải chia nhỏ thành:
// - ViewModeSelector (đã có rồi!)
// - FilterControls (đã có rồi!)  
// - ActionButtons (cần tạo)
```

---

### 5. **TaskBar.tsx** ❌
**Vấn đề**: File **rỗng** (0 bytes)! Chưa implement gì cả.

---

## 📋 Danh Sách Cần Fix

### **CRITICAL (Phải fix ngay)**

1. ❌ **ChartArea.tsx**
   - Chuyển logic `getDatePosition` sang dùng hook `useDatePosition`
   - Fix imports: `@/hooks/useTasks` → `../types/task.types`
   - Nhận `getDatePosition` từ props thay vì tính toán

2. ❌ **TaskListTable.tsx**
   - Fix tất cả imports sai (4 imports)
   - Tạo `useTableEditing` hook cho editing state
   - Component chỉ render UI, nhận callbacks

3. ❌ **CreateTaskDialog.tsx**
   - Xóa 3 functions duplicate: `isHoliday`, `countWorkingDays`, `addWorkingDays`
   - Dùng `useWorkingDays` hook thay thế
   - Fix imports

4. ❌ **GanttToolbar.tsx**
   - Xóa export type (dùng từ hooks)
   - Chia nhỏ component (quá lớn 636 lines)

5. ❌ **TaskBar.tsx**
   - Implement component (hiện đang rỗng)

---

## ✅ Nguyên Tắc Refactor

### **Components PHẢI LÀ**:
```tsx
// ✅ Pure UI Component
export function MyComponent({
  data,           // ✅ Nhận data từ props
  onAction,       // ✅ Nhận callbacks
  className,      // ✅ Styling props
}) {
  // ✅ Chỉ có render logic
  return (
    <div className={className}>
      {data.map(item => (
        <div onClick={() => onAction(item.id)}>
          {item.name}
        </div>
      ))}
    </div>
  );
}
```

### **Components KHÔNG ĐƯỢC**:
```tsx
// ❌ Business Logic in Component
export function MyComponent() {
  // ❌ Calculations
  const calculated = useMemo(() => {
    // Complex calculation logic
  }, []);
  
  // ❌ Data fetching
  const { data } = useSomeQuery();
  
  // ❌ Complex state management
  const [state1, setState1] = useState();
  const [state2, setState2] = useState();
  
  return <div>...</div>;
}
```

---

## 🎯 Action Items

### **Phase 1: Fix Imports** (1 hour)
- [ ] Fix all `@/hooks/useTasks` → `../types/task.types`
- [ ] Fix all `@/hooks/useTaskStatuses` → `../types/task.types`
- [ ] Fix all `@/hooks/useTaskLabels` → `../types/task.types`
- [ ] Fix all `./GanttView` → `../types/gantt.types`

### **Phase 2: Remove Duplicate Logic** (2 hours)
- [ ] ChartArea: Dùng `useDatePosition` hook
- [ ] CreateTaskDialog: Dùng `useWorkingDays` hook
- [ ] TaskListTable: Tạo `useTableEditing` hook

### **Phase 3: Implement Missing Components** (1 hour)
- [ ] Implement TaskBar.tsx (hiện đang rỗng)
- [ ] Implement các components trong bars/, timeline/, dialogs/

### **Phase 4: Split Large Components** (2 hours)
- [ ] Chia GanttToolbar thành sub-components
- [ ] Chia TaskListTable thành sub-components

---

## 📊 Expected Results

### **Before**:
```
❌ ChartArea.tsx: 532 lines với logic tính toán
❌ TaskListTable.tsx: 827 lines với state management
❌ CreateTaskDialog.tsx: 481 lines với duplicate logic
❌ Imports sai: import từ @/hooks/...
❌ TaskBar.tsx: Rỗng (0 bytes)
```

### **After**:
```
✅ ChartArea.tsx: 100-150 lines - Pure UI rendering
✅ TaskListTable.tsx: 200-300 lines - Pure table rendering
✅ CreateTaskDialog.tsx: 150-200 lines - Pure form rendering
✅ Imports đúng: import từ ../types/, ../hooks/
✅ TaskBar.tsx: 50-80 lines - Task bar rendering
✅ All logic trong hooks
```

---

## 🚀 Priority

**HIGH PRIORITY** (Fix trong 1-2 ngày):
1. Fix imports (breaking changes)
2. Remove duplicate logic
3. Implement TaskBar.tsx

**MEDIUM PRIORITY** (Fix trong 3-5 ngày):
4. Tạo useTableEditing hook
5. Refactor ChartArea dùng useDatePosition

**LOW PRIORITY** (Nice to have):
6. Split large components
7. Add unit tests

---

**Status**: 🔴 **CRITICAL - Components chưa chuẩn hóa!**
