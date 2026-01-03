# Gantt Feature Module

A feature-sliced design module for Gantt chart functionality with clean architecture.

## 🏗️ Architecture

This feature follows **Service-Repository + Feature-Sliced Design** pattern:

```
feature/gantt/
├── types/              # TypeScript type definitions
├── services/           # Business logic layer
│   ├── api/           # Real API implementations (Supabase)
│   ├── mocks/         # Mock data for development
│   ├── interfaces/    # Service contracts
│   └── factory.ts     # Service switcher (real/mock)
├── store/             # Zustand state management
├── hooks/             # React Query hooks
│   ├── queries/       # Data fetching hooks
│   └── mutations/     # Data mutation hooks
├── components/        # React components
├── lib/               # Utility functions
└── pages/             # Page components
```

## 🚀 Usage

### Basic Example

```typescript
import { 
  useGetTasks, 
  useCreateTask, 
  useGanttStore 
} from '@/feature/gantt';

function GanttComponent({ projectId }: { projectId: string }) {
  // Fetch data
  const { data: tasks, isLoading } = useGetTasks(projectId);
  
  // Mutations
  const createTask = useCreateTask();
  
  // Global state
  const { viewMode, setViewMode } = useGanttStore();
  
  // ... component logic
}
```

### Mock Data Mode

Set environment variable to use mock data:

```bash
# .env
VITE_USE_MOCK=true
```

## 📦 What's Included

### ✅ Implemented

- [x] Type definitions (Task, Allocation, Gantt types)
- [x] Service layer (Real + Mock implementations)
- [x] Service factory (Environment-based switching)
- [x] Zustand store (View, UI, Task slices)
- [x] React Query hooks (Queries + Mutations)
- [x] Mock data (Realistic project structure)

### 🚧 To Be Migrated

- [ ] Component migration from old structure
- [ ] Utility functions
- [ ] Context providers
- [ ] UI hooks (DnD, Scroll, Zoom)

## 🔌 Service Layer

### Query Data

```typescript
// Tasks
const { data: tasks } = useGetTasks(projectId);
const { data: labels } = useGetTaskLabels(projectId);

// Allocations
const { data: allocations } = useGetAllocations({ 
  projectId, 
  startDate: '2026-01-01',
  endDate: '2026-12-31'
});

// Settings
const { data: viewSettings } = useGetViewSettings();
const { data: milestones } = useGetProjectMilestones(projectId);
```

### Mutate Data

```typescript
// Create task
const createTask = useCreateTask();
await createTask.mutateAsync({
  project_id: projectId,
  name: 'New Task',
  duration: 5
});

// Update task
const updateTask = useUpdateTask();
await updateTask.mutateAsync({
  taskId: 'task-1',
  updates: { progress: 50 }
});

// Bulk operations
const bulkUpdate = useBulkUpdateTasks();
await bulkUpdate.mutateAsync({
  projectId,
  updates: [
    { id: 'task-1', updates: { progress: 100 } },
    { id: 'task-2', updates: { progress: 50 } }
  ]
});
```

## 🗄️ State Management

### View State

```typescript
const { 
  viewMode, 
  zoomLevel, 
  startDate, 
  setViewMode,
  goToToday 
} = useGanttStore();
```

### UI State

```typescript
const {
  selectedTaskId,
  expandedTaskIds,
  isTaskDialogOpen,
  selectTask,
  toggleTaskExpanded,
  openTaskDialog
} = useGanttStore();
```

### Filter State

```typescript
const {
  filterAssigneeIds,
  searchQuery,
  setFilterAssignees,
  setSearchQuery,
  clearFilters
} = useGanttStore();
```

## 📝 Migration Guide

### Old Code

```typescript
// ❌ Old way (direct Supabase in component)
import { supabase } from '@/integrations/supabase/client';

const { data } = await supabase.from('tasks').select('*');
```

### New Code

```typescript
// ✅ New way (through service layer)
import { useGetTasks } from '@/feature/gantt';

const { data: tasks } = useGetTasks(projectId);
```

## 🧪 Testing

Mock mode allows for:
- Faster development without database
- Predictable test data
- Offline development
- Component testing in isolation

## 📚 Learn More

- [Feature-Sliced Design](https://feature-sliced.design/)
- [React Query](https://tanstack.com/query/latest)
- [Zustand](https://zustand-demo.pmnd.rs/)
