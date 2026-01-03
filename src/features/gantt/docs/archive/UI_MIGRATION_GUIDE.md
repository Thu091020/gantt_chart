# 🔄 UI Components Migration Guide

## Tự động hóa migration với script

Đã tạo file `migrate-ui-components.sh` để tự động copy tất cả UI components từ `src/components/gantt/` sang `src/feature/gantt/`.

### Chạy migration script:

```bash
cd src/feature/gantt
chmod +x migrate-ui-components.sh
./migrate-ui-components.sh
```

Script sẽ copy các files:
- ✅ 5 Dialog components → `components/dialogs/`
- ✅ 1 Toolbar component → `components/toolbar/`  
- ✅ 1 Table component → `components/columns/`
- ✅ 2 Timeline components → `components/timeline/`
- ✅ 1 Main page → `pages/GanttChart.tsx`

---

## Hoặc migration thủ công

Nếu không dùng script, copy từng file và update imports:

### 1. Dialog Components

```bash
cp src/components/gantt/BaselineDialog.tsx src/feature/gantt/components/dialogs/BaselineManagerDialog.tsx
cp src/components/gantt/TaskFormDialog.tsx src/feature/gantt/components/dialogs/CreateTaskDialog.tsx
cp src/components/gantt/LabelSettingsDialog.tsx src/feature/gantt/components/dialogs/LabelSettingsDialog.tsx
cp src/components/gantt/StatusSettingsDialog.tsx src/feature/gantt/components/dialogs/StatusSettingsDialog.tsx
cp src/components/gantt/MilestoneDialog.tsx src/feature/gantt/components/dialogs/MilestoneDialog.tsx
```

### 2. Toolbar Components

```bash
cp src/components/gantt/GanttToolbar.tsx src/feature/gantt/components/toolbar/GanttToolbar.tsx
```

### 3. Table Components

```bash
cp src/components/gantt/TaskGrid.tsx src/feature/gantt/components/columns/TaskListTable.tsx
```

### 4. Timeline Components

```bash
cp src/components/gantt/GanttChart.tsx src/feature/gantt/components/timeline/ChartArea.tsx
cp src/components/gantt/GanttPanels.tsx src/feature/gantt/components/timeline/GanttPanels.tsx
```

### 5. Main Page

```bash
cp src/components/gantt/GanttView.tsx src/feature/gantt/pages/GanttChart.tsx
```

---

## Update Imports (QUAN TRỌNG!)

Sau khi copy, cần update imports trong TẤT CẢ files đã copy:

### Find & Replace patterns:

```typescript
// Old hooks imports → New feature/gantt hooks
import { useTasks, useAddTask, ... } from '@/hooks/useTasks'
↓↓↓
import { useGetTasks, useCreateTask, ... } from '../../hooks/queries/useTaskQueries'
import { useCreateTask, useUpdateTask, ... } from '../../hooks/mutations/useTaskMutations'

// Allocations
import { useAllocations, ... } from '@/hooks/useAllocations'  
↓↓↓
import { useGetAllocations, ... } from '../../hooks/queries/useAllocationQueries'
import { useBulkSetAllocations } from '../../hooks/mutations/useAllocationMutations'

// Baselines
import { useBaselines, useAddBaseline, ... } from '@/hooks/useBaselines'
↓↓↓
import { useGetBaselines } from '../../hooks/queries/useSettingQueries'
// Note: Add/Update/Delete baseline hooks need to be created

// Task Labels
import { useTaskLabels, ... } from '@/hooks/useTaskLabels'
↓↓↓
import { useGetTaskLabels, useCreateTaskLabel, ... } from '../../hooks/queries/useTaskQueries'

// Task Statuses  
import { useTaskStatuses, ... } from '@/hooks/useTaskStatuses'
↓↓↓
import { useGetTaskStatuses } from '../../hooks/queries/useTaskQueries'

// Project Milestones
import { useProjectMilestones, ... } from '@/hooks/useProjectMilestones'
↓↓↓
import { useGetProjectMilestones } from '../../hooks/queries/useSettingQueries'

// View Settings
import { useViewSettings, useSaveViewSettings } from '@/hooks/useViewSettings'
↓↓↓
import { useGetViewSettings } from '../../hooks/queries/useSettingQueries'

// Types imports (if needed)
import { Task } from '@/hooks/useTasks'
↓↓↓
import { Task } from '../../types/task.types'

import { TaskLabel } from '@/hooks/useTaskLabels'
↓↓↓
import { TaskLabel } from '../../types/task.types'
```

### Giữ nguyên imports:

✅ Shared UI components: `@/components/ui/*`  
✅ Shared utilities: `@/lib/utils`  
✅ External libraries: `date-fns`, `lucide-react`, `sonner`, etc.

---

## Checklist sau khi migration

- [ ] Đã copy tất cả 10 component files
- [ ] Đã update tất cả imports từ old hooks → new hooks
- [ ] Chạy `npm run type-check` hoặc `tsc --noEmit` - không có lỗi
- [ ] Test feature/gantt standalone (có thể import và dùng)
- [ ] Update `feature/gantt/index.ts` để export components mới
- [ ] Test trong app thực tế
- [ ] Xóa folder `src/components/gantt/` cũ (sau khi confirm)
- [ ] Update `src/pages/ProjectDetail.tsx` để import từ feature/gantt

---

## Automation Script (Python alternative)

Nếu bash script không chạy được, dùng Python:

```python
#!/usr/bin/env python3
import shutil
import os
from pathlib import Path

# Define paths
source = Path('src/components/gantt')
target_base = Path('src/feature/gantt')

# File mappings
mappings = {
    'BaselineDialog.tsx': 'components/dialogs/BaselineManagerDialog.tsx',
    'TaskFormDialog.tsx': 'components/dialogs/CreateTaskDialog.tsx',
    'LabelSettingsDialog.tsx': 'components/dialogs/LabelSettingsDialog.tsx',
    'StatusSettingsDialog.tsx': 'components/dialogs/StatusSettingsDialog.tsx',
    'MilestoneDialog.tsx': 'components/dialogs/MilestoneDialog.tsx',
    'GanttToolbar.tsx': 'components/toolbar/GanttToolbar.tsx',
    'TaskGrid.tsx': 'components/columns/TaskListTable.tsx',
    'GanttChart.tsx': 'components/timeline/ChartArea.tsx',
    'GanttPanels.tsx': 'components/timeline/GanttPanels.tsx',
    'GanttView.tsx': 'pages/GanttChart.tsx',
}

# Copy files
for src_file, dest_path in mappings.items():
    src_path = source / src_file
    dest_full = target_base / dest_path
    
    if src_path.exists():
        shutil.copy2(src_path, dest_full)
        print(f'✅ Copied {src_file} → {dest_path}')
    else:
        print(f'❌ Source not found: {src_file}')

print('\n✅ Migration complete! Now update imports.')
```

Lưu file `migrate.py` và chạy: `python3 migrate.py`

---

## Expected Results

Sau khi hoàn tất, `feature/gantt` sẽ có:

```
feature/gantt/
├── components/
│   ├── dialogs/
│   │   ├── BaselineManagerDialog.tsx ✅ (migrated)
│   │   ├── CreateTaskDialog.tsx ✅ (migrated)
│   │   ├── LabelSettingsDialog.tsx ✅ (migrated)
│   │   ├── StatusSettingsDialog.tsx ✅ (migrated)
│   │   └── MilestoneDialog.tsx ✅ (migrated)
│   ├── toolbar/
│   │   └── GanttToolbar.tsx ✅ (migrated)
│   ├── columns/
│   │   └── TaskListTable.tsx ✅ (migrated)
│   └── timeline/
│       ├── ChartArea.tsx ✅ (migrated)
│       └── GanttPanels.tsx ✅ (migrated)
├── pages/
│   └── GanttChart.tsx ✅ (migrated)
├── hooks/ ✅ (already done)
├── services/ ✅ (already done)
├── store/ ✅ (already done)
├── types/ ✅ (already done)
└── lib/ ✅ (already done)
```

Feature là **100% standalone** và có thể copy sang dự án khác! 🎉
