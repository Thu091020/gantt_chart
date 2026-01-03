# 🔧 REFACTORING COMPONENTS - ACTION PLAN

## ⚠️ VẤN ĐỀ HIỆN TẠI

Các components vẫn đang import trực tiếp từ external dependencies:
- ❌ `import { Button } from '@/components/ui/button'`
- ❌ `import { Task } from '@/hooks/useTasks'`
- ❌ `import { cn } from '@/lib/utils'`

**Hệ quả**: Feature KHÔNG thể standalone, vẫn phụ thuộc vào project!

---

## ✅ GIẢI PHÁP

### 1. Đã Tạo Internal Wrappers

#### `context/GanttContext.tsx` ✅
- `GanttProvider` - Provider component
- `useGanttContext()` - Access config
- `useGanttUI()` - Access UI components
- `useGanttUtils()` - Access utilities
- `useGanttAuth()` - Access auth
- `useGanttDatabase()` - Access database

#### `components/internal/ui.tsx` ✅
Wrapped UI components từ adapters:
```typescript
import { Button, Input, Dialog, ... } from '../components/internal/ui';
```

#### `components/internal/utils.ts` ✅
Wrapped utilities:
```typescript
import { cn, toast } from '../components/internal/utils';
```

### 2. Cần Refactor Components

Tất cả components cần chuyển từ:
```typescript
// ❌ CŨ
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Task } from '@/hooks/useTasks';
```

Sang:
```typescript
// ✅ MỚI
import { Button } from '../internal/ui';
import { cn } from '../internal/utils';
import type { Task } from '../../types/task.types';
```

---

## 📋 DANH SÁCH CẦN REFACTOR

### Components cần update (50+ files):

#### Toolbar (4 files)
- [ ] `components/toolbar/GanttToolbar.tsx`
- [ ] `components/toolbar/FilterControls.tsx`
- [ ] `components/toolbar/ViewModeSelector.tsx`
- [ ] `components/toolbar/index.ts`

#### Columns (5 files)
- [ ] `components/columns/TaskGrid.tsx`
- [ ] `components/columns/TaskListTable.tsx`
- [ ] `components/columns/TaskRow.tsx`
- [ ] `components/columns/columns-def.tsx`
- [ ] `components/columns/index.ts`

#### Timeline (5 files)
- [ ] `components/timeline/ChartArea.tsx`
- [ ] `components/timeline/GanttPanels.tsx`
- [ ] `components/timeline/TimelineGrid.tsx`
- [ ] `components/timeline/TimelineHeader.tsx`
- [ ] `components/timeline/TimeMarker.tsx`

#### Bars (4 files)
- [ ] `components/bars/TaskBar.tsx`
- [ ] `components/bars/ProgressBar.tsx`
- [ ] `components/bars/MilestoneDiamond.tsx`
- [ ] `components/bars/DependencyLine.tsx`

#### Dialogs (8 files)
- [ ] `components/dialogs/CreateTaskDialog.tsx`
- [ ] `components/dialogs/TaskDetailDialog.tsx`
- [ ] `components/dialogs/BaselineManagerDialog.tsx`
- [ ] `components/dialogs/MilestoneDialog.tsx`
- [ ] `components/dialogs/LabelSettingsDialog.tsx`
- [ ] `components/dialogs/StatusSettingsDialog.tsx`
- [ ] `components/dialogs/ViewSettingsDialog.tsx`
- [ ] `components/dialogs/index.ts`

#### Main Components (3 files)
- [ ] `components/GanttChart.tsx`
- [ ] `components/GanttPanels.tsx`
- [ ] `components/index.ts`

#### Pages (3 files)
- [ ] `pages/GanttView.tsx`
- [ ] `pages/GanttChart.tsx`
- [ ] `pages/GanttChart.refactored.tsx`

---

## 🔄 REFACTORING PATTERN

### Pattern 1: UI Components

```typescript
// ❌ Before
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

// ✅ After
import { Button, Dialog, DialogContent } from '../internal/ui';
```

### Pattern 2: Utilities

```typescript
// ❌ Before
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ✅ After  
import { cn, toast } from '../internal/utils';
```

### Pattern 3: Types

```typescript
// ❌ Before
import { Task } from '@/hooks/useTasks';
import { TaskLabel } from '@/hooks/useTaskLabels';

// ✅ After
import type { Task } from '../../types/task.types';
// TaskLabel đã có trong types/gantt.types.ts hoặc cần thêm
```

### Pattern 4: External Data (Keep in pages only)

```typescript
// Pages có thể dùng external hooks
import { useTasks } from '@/hooks/useTasks';

// Hoặc dùng internal hooks
import { useGetTasks } from '../hooks/queries/useTaskQueries';
```

---

## 🎯 IMPLEMENTATION STEPS

### Step 1: Update Types (if needed)
Đảm bảo tất cả types đã có trong `types/`:
- `Task` → `types/task.types.ts` ✅
- `TaskLabel` → Cần check
- `TaskStatus` → Cần check
- `ProjectMilestone` → Cần check

### Step 2: Refactor Components (Priority order)

1. **High Priority** (Dùng nhiều nhất):
   - [ ] `components/GanttChart.tsx`
   - [ ] `components/GanttPanels.tsx`
   - [ ] `pages/GanttView.tsx`

2. **Medium Priority**:
   - [ ] All toolbar components
   - [ ] All column components
   - [ ] All timeline components

3. **Low Priority**:
   - [ ] Dialogs (ít dùng hơn)
   - [ ] Bars (simple components)

### Step 3: Update Exports
Update `components/index.ts` to export properly

### Step 4: Wrap GanttView with Provider
```typescript
// pages/GanttView.tsx
import { GanttProvider } from '../context/GanttContext';

export function GanttView(props) {
  return (
    <GanttProvider>
      {/* existing content */}
    </GanttProvider>
  );
}
```

---

## 📝 REFACTORING SCRIPT

Có thể dùng find-replace với regex:

### Replace UI Imports
```bash
# Find
import \{ (.*) \} from '@/components/ui/(.*)';

# Replace with
import { $1 } from '../internal/ui';
```

### Replace Utils
```bash
# Find
import \{ cn \} from '@/lib/utils';

# Replace with
import { cn } from '../internal/utils';
```

### Replace Types
```bash
# Find
import \{ Task \} from '@/hooks/useTasks';

# Replace with
import type { Task } from '../../types/task.types';
```

---

## ⚡ QUICK FIX (Temporary)

Nếu muốn test nhanh trước khi refactor hết:

1. Update `pages/GanttView.tsx` để wrap với GanttProvider
2. Refactor 3-5 components quan trọng nhất
3. Test xem có hoạt động không
4. Tiếp tục refactor từng phần

---

## ✅ VERIFICATION

Sau khi refactor xong, verify:

```bash
# Không còn imports từ @/components, @/hooks, @/lib
grep -r "from '@/components" src/features/gantt/components/
grep -r "from '@/hooks" src/features/gantt/components/
grep -r "from '@/lib" src/features/gantt/components/

# Kết quả mong đợi: No matches (hoặc chỉ trong pages/)
```

---

## 🎓 BEST PRACTICES

1. **Components**: Chỉ import từ `../internal/` hoặc `../../types/`
2. **Pages**: Có thể dùng external hooks (điểm kết nối duy nhất)
3. **Types**: Luôn dùng `import type` cho type-only imports
4. **Testing**: Test từng component sau khi refactor

---

## 📊 PROGRESS TRACKING

- ✅ Created internal wrappers
- ⏳ Refactoring components (0/50)
- ⏳ Update exports
- ⏳ Testing
- ⏳ Documentation update

---

**Priority**: HIGH 🔴  
**Estimated time**: 2-3 hours  
**Impact**: Makes feature truly standalone
