# ✅ TODO CHECKLIST

## 🔴 URGENT - Cần Làm Ngay

### 1. Complete Missing Types
- [ ] Check `types/gantt.types.ts` for missing types
- [ ] Add `TaskLabel` if missing
- [ ] Add `TaskStatus` if missing  
- [ ] Add `ProjectMilestone` if missing
- [ ] Add `TaskBarLabels` if missing

### 2. Wrap Main Page with Provider
File: `pages/GanttView.tsx`
```typescript
import { GanttProvider } from '../context/GanttContext';

export function GanttView(props) {
  return (
    <GanttProvider>
      {/* existing content */}
    </GanttProvider>
  );
}
```

### 3. Refactor Top 3 Components

#### File: `components/GanttChart.tsx`
- [ ] Replace `import { cn } from '@/lib/utils'` → `import { cn } from './internal/utils'`
- [ ] Replace `import { Task } from '@/hooks/useTasks'` → `import type { Task } from '../types/task.types'`
- [ ] Test component

#### File: `components/GanttPanels.tsx`
- [ ] Replace UI imports → `'./internal/ui'`
- [ ] Replace type imports → `'../types/*'`
- [ ] Test component

#### File: `pages/GanttView.tsx`
- [ ] Add GanttProvider wrapper
- [ ] Keep external hooks (this is the integration point)
- [ ] Test page

---

## 🟡 IMPORTANT - Nên Làm Sau

### 4. Refactor Component Groups

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

---

## 🟢 OPTIONAL - Khi Có Thời Gian

### 5. Update Index Files
- [ ] `components/index.ts`
- [ ] Update exports if needed

### 6. Add Tests
- [ ] Test GanttProvider
- [ ] Test internal wrappers
- [ ] Test refactored components

### 7. Update Documentation
- [ ] Update STATUS.md when done
- [ ] Update DONE.md
- [ ] Update README.md if needed

---

## 📊 PROGRESS

- Infrastructure: ✅ 100%
- Documentation: ✅ 100%
- Component Refactoring: ⏳ 0%
- Testing: ⏳ 0%

**Overall**: 70% Complete

---

## 🎯 QUICK START

1. Read [STATUS.md](./STATUS.md)
2. Read [REFACTORING_PLAN.md](./REFACTORING_PLAN.md)
3. Start with section 🔴 URGENT above
4. Then continue with 🟡 IMPORTANT
5. Finally 🟢 OPTIONAL

---

**Estimated Time**: 3-4 hours total
- Urgent: 1 hour
- Important: 2 hours
- Optional: 1 hour
