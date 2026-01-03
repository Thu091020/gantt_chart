# Quick Reference: Gantt Components Migration

## 📦 Import Paths - Ngắn Gọn

### From Inside `features/gantt/`

```typescript
// From pages/
import { GanttPanels } from '../components/GanttPanels';
import { GanttToolbar } from '../components/toolbar/GanttToolbar';
import { CreateTaskDialog } from '../components/dialogs/CreateTaskDialog';

// From components/
import { TaskGrid } from './columns/TaskGrid';
import { MilestoneDialog } from './dialogs/MilestoneDialog';
```

### From Outside `features/gantt/`

```typescript
// Recommended - using index files
import { GanttView } from '@/features/gantt/pages';
import { GanttChart, GanttToolbar } from '@/features/gantt/components';

// Direct import
import { GanttView } from '@/features/gantt/pages/GanttView';
import { GanttToolbar } from '@/features/gantt/components/toolbar/GanttToolbar';
```

## 🗂️ Folder Breakdown

| Folder                 | Contents           | Purpose                        |
| ---------------------- | ------------------ | ------------------------------ |
| `components/`          | Main UI components | Reusable components            |
| `components/toolbar/`  | GanttToolbar       | Controls & view mode buttons   |
| `components/columns/`  | TaskGrid           | Task list table                |
| `components/dialogs/`  | All dialogs        | Modals (Create, Baseline, etc) |
| `components/bars/`     | _Not migrated_     | Task bar visualization         |
| `components/timeline/` | _Not migrated_     | Timeline visualization         |
| `pages/`               | GanttView, wrapper | Main container & entry point   |
| `hooks/`               | Custom hooks       | Business logic                 |
| `store/`               | Zustand store      | Global state                   |
| `types/`               | TypeScript types   | Type definitions               |
| `services/`            | API/business logic | Data fetching                  |
| `lib/`                 | Utilities          | Helpers & utils                |

## 🔄 What Changed

### Files Moved ✅

- ✅ `components/gantt/GanttChart.tsx` → `features/gantt/components/`
- ✅ `components/gantt/GanttPanels.tsx` → `features/gantt/components/`
- ✅ `components/gantt/GanttView.tsx` → `features/gantt/pages/`
- ✅ `components/gantt/GanttToolbar.tsx` → `features/gantt/components/toolbar/`
- ✅ `components/gantt/TaskGrid.tsx` → `features/gantt/components/columns/`
- ✅ `components/gantt/TaskFormDialog.tsx` → `features/gantt/components/dialogs/CreateTaskDialog.tsx`
- ✅ `components/gantt/BaselineDialog.tsx` → `features/gantt/components/dialogs/BaselineManagerDialog.tsx`
- ✅ `components/gantt/MilestoneDialog.tsx` → `features/gantt/components/dialogs/`
- ✅ `components/gantt/StatusSettingsDialog.tsx` → `features/gantt/components/dialogs/`
- ✅ `components/gantt/LabelSettingsDialog.tsx` → `features/gantt/components/dialogs/`

### Imports Updated ✅

- ✅ GanttView.tsx (pages)
- ✅ GanttPanels.tsx (components)
- ✅ TaskGrid.tsx (components/columns)
- ✅ GanttToolbar.tsx (components/toolbar)
- ✅ GanttChart.tsx (wrapper page)
- ✅ ProjectDetail.tsx (external reference)

### Index Files Created ✅

- ✅ `components/index.ts`
- ✅ `components/toolbar/index.ts`
- ✅ `components/columns/index.ts`
- ✅ `components/dialogs/index.ts`
- ✅ `pages/index.ts`

## ❓ FAQs

**Q: Where should I put a new Gantt component?**
A: Follow the structure:

- UI component for toolbar → `components/toolbar/`
- Task display component → `components/columns/`
- Dialog/modal → `components/dialogs/`
- Chart/timeline related → `components/timeline/` or `components/bars/`

**Q: Should I still use `components/gantt/` for new files?**
A: No! All Gantt components should go in `features/gantt/components/` now.

**Q: How do I import from features/gantt in other parts?**
A: Use the index files:

```typescript
// Best practice
import { GanttView } from '@/features/gantt/pages';

// Also works
import { GanttView } from '@/features/gantt/pages/GanttView';
```

**Q: Can I still import from the old location?**
A: The old `src/components/gantt/` folder still exists but is deprecated. Update any remaining imports to use the new locations.

**Q: Do I need to update my project immediately?**
A: No urgency - both paths work for now. Update incrementally as you work on files.

---

✅ Migration completed on January 3, 2026
