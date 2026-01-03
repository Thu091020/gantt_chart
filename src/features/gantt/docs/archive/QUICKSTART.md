# 🚀 Quick Start Guide - Gantt Feature

## Installation

Kiểm tra dependencies đã cài:

```bash
npm list zustand @tanstack/react-query sonner
```

Nếu thiếu, cài đặt:

```bash
npm install zustand
```

## Basic Usage

### 1. Fetch Tasks

```typescript
import { useGetTasks } from '@/feature/gantt';

function MyComponent({ projectId }: { projectId: string }) {
  const { data: tasks, isLoading, error } = useGetTasks(projectId);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {tasks?.map(task => (
        <div key={task.id}>{task.name}</div>
      ))}
    </div>
  );
}
```

### 2. Create Task

```typescript
import { useCreateTask } from '@/feature/gantt';

function CreateTaskButton({ projectId }: { projectId: string }) {
  const createTask = useCreateTask();

  const handleCreate = async () => {
    await createTask.mutateAsync({
      project_id: projectId,
      name: 'New Task',
      duration: 5,
      progress: 0
    });
  };

  return (
    <button 
      onClick={handleCreate}
      disabled={createTask.isPending}
    >
      {createTask.isPending ? 'Creating...' : 'Create Task'}
    </button>
  );
}
```

### 3. Update Task

```typescript
import { useUpdateTask } from '@/feature/gantt';

function TaskProgressSlider({ taskId, currentProgress }: Props) {
  const updateTask = useUpdateTask();

  const handleProgressChange = (value: number) => {
    updateTask.mutate({
      taskId,
      updates: { progress: value }
    });
  };

  return (
    <input 
      type="range" 
      min="0" 
      max="100" 
      value={currentProgress}
      onChange={(e) => handleProgressChange(Number(e.target.value))}
    />
  );
}
```

### 4. Use Store (Global State)

```typescript
import { useGanttStore } from '@/feature/gantt';

function GanttToolbar() {
  const { 
    viewMode, 
    setViewMode,
    goToToday,
    goToNext,
    goToPrevious 
  } = useGanttStore();

  return (
    <div>
      <select 
        value={viewMode} 
        onChange={(e) => setViewMode(e.target.value as any)}
      >
        <option value="day">Day</option>
        <option value="week">Week</option>
        <option value="month">Month</option>
      </select>
      
      <button onClick={goToPrevious}>◀ Previous</button>
      <button onClick={goToToday}>Today</button>
      <button onClick={goToNext}>Next ▶</button>
    </div>
  );
}
```

### 5. Allocations

```typescript
import { useGetAllocations, useBulkSetAllocations } from '@/feature/gantt';

function AllocationManager({ projectId }: Props) {
  const { data: allocations } = useGetAllocations({ 
    projectId,
    startDate: '2026-01-01',
    endDate: '2026-12-31'
  });
  
  const bulkSet = useBulkSetAllocations();

  const syncAllocations = async () => {
    await bulkSet.mutateAsync([
      { employeeId: 'emp-1', projectId, date: '2026-01-15', effort: 1, source: 'gantt' },
      { employeeId: 'emp-2', projectId, date: '2026-01-15', effort: 0.5, source: 'gantt' }
    ]);
  };

  return (
    <div>
      <button onClick={syncAllocations}>Sync Allocations</button>
      <div>Total: {allocations?.length} allocations</div>
    </div>
  );
}
```

### 6. Filters

```typescript
import { useGanttStore } from '@/feature/gantt';

function TaskFilters() {
  const {
    filterAssigneeIds,
    searchQuery,
    setFilterAssignees,
    setSearchQuery,
    clearFilters
  } = useGanttStore();

  return (
    <div>
      <input
        type="text"
        placeholder="Search tasks..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      
      {/* Assignee multi-select */}
      <select
        multiple
        value={filterAssigneeIds}
        onChange={(e) => {
          const selected = Array.from(e.target.selectedOptions, opt => opt.value);
          setFilterAssignees(selected);
        }}
      >
        <option value="emp-1">Employee 1</option>
        <option value="emp-2">Employee 2</option>
      </select>
      
      <button onClick={clearFilters}>Clear Filters</button>
    </div>
  );
}
```

## Mock Data Mode

### Enable Mock Data

Create or edit `.env`:

```bash
VITE_USE_MOCK=true
```

### Benefits

- ✅ Develop without database connection
- ✅ Predictable test data
- ✅ Faster development cycle
- ✅ Offline development
- ✅ Component isolation testing

### Check Current Mode

```typescript
import { isUsingMockData } from '@/feature/gantt';

console.log('Using mock data:', isUsingMockData);
```

## Advanced Patterns

### Optimistic Updates

```typescript
import { useUpdateTask } from '@/feature/gantt';

const updateTask = useUpdateTask({
  onMutate: async (variables) => {
    // Cancel outgoing queries
    // Update cache optimistically
    // Return rollback context
  },
  onError: (err, variables, context) => {
    // Rollback on error
  },
  onSuccess: () => {
    // Sync with server
  }
});
```

### Dependent Queries

```typescript
const { data: project } = useGetProject(projectId);
const { data: tasks } = useGetTasks(projectId, {
  enabled: !!project // Only fetch when project exists
});
```

### Infinite Scroll / Pagination

```typescript
// Coming soon in Phase 6
```

## Troubleshooting

### Mock data not loading

Check environment variable:
```bash
echo $VITE_USE_MOCK
```

### TypeScript errors

Ensure proper imports:
```typescript
import { Task } from '@/feature/gantt/types/task.types';
// OR
import { Task } from '@/feature/gantt';
```

### React Query devtools

Install for debugging:
```bash
npm install @tanstack/react-query-devtools
```

Add to App:
```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<ReactQueryDevtools initialIsOpen={false} />
```

## Next Steps

1. Read [README.md](./README.md) for architecture overview
2. Check [MIGRATION_CHECKLIST.md](./MIGRATION_CHECKLIST.md) for migration progress
3. Explore mock data in `services/mocks/data/`
4. Start migrating components from old structure

## Support

- Issues: Create GitHub issue
- Questions: Team discussion channel
- Documentation: Check inline JSDoc comments
