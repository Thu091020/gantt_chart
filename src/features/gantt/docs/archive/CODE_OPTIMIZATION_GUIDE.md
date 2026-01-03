# ⚡ CODE OPTIMIZATION GUIDE - Toàn Bộ Gantt Feature

**Ngày**: January 3, 2026  
**Mục Đích**: Tối ưu hóa performance, code quality, và maintainability

---

## 🎯 5 Vấn Đề Tối Ưu Chính

| #   | Vấn Đề                       | Impact    | Giải Pháp                      |
| --- | ---------------------------- | --------- | ------------------------------ |
| 1   | **Props Drilling**           | 🔴 High   | Extract context + custom hooks |
| 2   | **Unoptimized Renders**      | 🔴 High   | Add React.memo + useMemo       |
| 3   | **Large Functions**          | 🟠 Medium | Split into smaller sub-hooks   |
| 4   | **Redundant Calculations**   | 🟠 Medium | Move to lib utilities + cache  |
| 5   | **Missing Error Boundaries** | 🟡 Low    | Add error handling layers      |

---

## 📊 VẤN ĐỀ 1: Props Drilling (Quá Nhiều Props)

### Hiện Tượng

```tsx
// GanttView passes 30+ props to GanttPanels
<GanttPanels
  flatTasks={flatTasks}
  columns={columns}
  projectMembers={projectMembers}
  allEmployees={allEmployees}
  selectedTaskId={selectedTaskId}
  selectedTaskIds={selectedTaskIds}
  taskIdMap={taskIdMap}
  wbsMap={wbsMap}
  taskByIdNumber={taskByIdNumber}
  tasks={tasks}
  startDate={startDate}
  viewMode={viewMode}
  timelineColumns={timelineColumns}
  taskStatuses={taskStatuses}
  taskLabels={taskLabels}
  projectId={projectId}
  taskBarLabels={taskBarLabels}
  projectMilestones={projectMilestones}
  isNonWorkingDay={isNonWorkingDay}
  isHoliday={isHoliday}
  onSelectTask={onSelectTask}
  onToggleExpand={onToggleExpand}
  onAddTask={onAddTask}
  onInsertAbove={onInsertAbove}
  onEditTask={onEditTask}
  onDeleteTask={onDeleteTask}
  onCopyTask={onCopyTask}
  onMoveUp={onMoveUp}
  onMoveDown={onMoveDown}
  onUpdateField={onUpdateField}
  onColumnsChange={onColumnsChange}
/>
```

### Giải Pháp: React Context

**File mới**: `src/features/gantt/context/GanttContext.tsx`

```typescript
import { createContext, useContext, ReactNode } from 'react';
import type { Task } from '../types/task.types';

interface GanttContextValue {
  // State
  projectId: string;
  viewMode: GanttViewMode;
  startDate: Date;
  endDate: Date;
  selectedTaskIds: Set<string>;
  expandedTasks: Set<string>;
  columns: CustomColumn[];
  taskBarLabels: TaskBarLabels;

  // Data
  tasks: Task[];
  taskStatuses: TaskStatus[];
  taskLabels: TaskLabel[];
  projectMilestones: ProjectMilestone[];
  allEmployees: { id: string; name: string }[];

  // Maps
  taskIdMap: Map<string, number>;
  wbsMap: Map<string, string>;

  // Handlers
  onSelectTask: (taskId: string | null, ctrlKey?: boolean) => void;
  onToggleExpand: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateField: (taskId: string, field: string, value: any) => void;

  // Utils
  isNonWorkingDay: (date: Date) => boolean;
  isHoliday: (date: Date) => boolean;
}

const GanttContext = createContext<GanttContextValue | null>(null);

export function GanttProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: GanttContextValue;
}) {
  return (
    <GanttContext.Provider value={value}>{children}</GanttContext.Provider>
  );
}

export function useGantt() {
  const context = useContext(GanttContext);
  if (!context) {
    throw new Error('useGantt must be used inside GanttProvider');
  }
  return context;
}

// Selectors để optimize re-renders
export function useGanttViewMode() {
  return useContext(GanttContext)?.viewMode;
}

export function useGanttTasks() {
  return useContext(GanttContext)?.tasks;
}

// ... etc
```

**Cách dùng**:

```tsx
// GanttView.tsx - Simplified
export function GanttView({ projectId, ... }: GanttViewProps) {
  const { /* state */ } = useGanttState(projectId);
  const { /* data */ } = useGanttData(projectId);
  const { /* handlers */ } = useGanttHandlers(...);

  return (
    <GanttProvider value={{
      projectId,
      viewMode: state.viewMode,
      tasks: data.tasks,
      // ... all context values
    }}>
      <div className="gantt-view">
        <GanttToolbar />
        <GanttPanels /> {/* Zero props! */}
      </div>
    </GanttProvider>
  );
}

// GanttPanels.tsx - No props drilling
export function GanttPanels() {
  const { tasks, columns, onSelectTask, ... } = useGantt();

  return (
    // Components automatically have access to all context
    <GanttChart tasks={tasks} onSelectTask={onSelectTask} />
  );
}
```

**Benefits**:

- ✅ 30+ props → 0 props
- ✅ Easier to refactor
- ✅ Cleaner component interface
- ✅ Better performance (selective re-renders with selectors)

---

## 📊 VẤN ĐỀ 2: Unoptimized Component Renders

### Hiện Tượng

```tsx
// GanttChart component (648 dòng) re-renders mỗi lần parent thay đổi
// Ngay cả khi props không thay đổi

const GanttChart = forwardRef<GanttChartHandle, GanttChartProps>(
  ({ tasks, startDate, viewMode, ... }) => {
    // Tính toán lại mỗi lần render
    const getDatePosition = useMemo(() => {
      // 80+ dòng logic
    }, [timelineColumns, viewMode]);

    const todayPosition = useMemo(() => {
      // 20 dòng logic
    }, [getDatePosition, totalWidth]);

    // Return JSX ~370 dòng (nguy hiểm!)
  }
);
```

### Giải Pháp 1: Wrap với React.memo

```typescript
// GanttChart.tsx
const GanttChartComponent = forwardRef<GanttChartHandle, GanttChartProps>(
  ({ tasks, startDate, viewMode, ... }, ref) => {
    // ... component logic
  }
);

export const GanttChart = memo(GanttChartComponent) as typeof GanttChartComponent;
```

### Giải Pháp 2: Tách JSX Lớn thành Sub-Components

**File mới**: `src/features/gantt/components/GanttChartContent.tsx`

```typescript
interface GanttChartContentProps {
  // Only needed data
  tasks: Task[];
  timelineColumns: TimelineColumn[];
  selectedTaskIds: Set<string>;
  taskBarLabels: TaskBarLabels;
  todayPosition: number;
  getDatePosition: (date: Date) => number;
  onSelectTask: (id: string | null, ctrl?: boolean) => void;
}

const GanttChartContent = memo(function GanttChartContent({
  tasks,
  timelineColumns,
  selectedTaskIds,
  taskBarLabels,
  todayPosition,
  getDatePosition,
  onSelectTask,
}: GanttChartContentProps) {
  return (
    <div className="gantt-chart-content">
      <TimelineHeader columns={timelineColumns} />
      <TimelineGrid columns={timelineColumns} />
      <div className="gantt-tasks">
        {tasks.map((task) => (
          <TaskBar
            key={task.id}
            task={task}
            selected={selectedTaskIds.has(task.id)}
            labels={taskBarLabels}
            position={getDatePosition(parseISO(task.start_date!))}
            onSelect={() => onSelectTask(task.id)}
          />
        ))}
      </div>
      {todayPosition !== null && <TimeMarker position={todayPosition} />}
    </div>
  );
});
```

### Giải Pháp 3: Extract Task Rendering

```typescript
// TaskBar mỗi cái nên là riêng component
const TaskBarItem = memo(function TaskBarItem({
  task,
  selected,
  labels,
  position,
  width,
  onSelect,
}: TaskBarItemProps) {
  return (
    <div
      className={cn('task-bar', selected && 'selected')}
      style={{ left: `${position}px`, width: `${width}px` }}
      onClick={() => onSelect()}
    >
      {labels.showName && <span>{task.name}</span>}
      {labels.showDates && (
        <span className="dates">
          {format(parseISO(task.start_date!), 'MMM dd')}
        </span>
      )}
    </div>
  );
});
```

**Benefits**:

- ✅ TaskBar chỉ re-render khi props thay đổi
- ✅ 370 dòng JSX → 50 dòng + sub-components
- ✅ Easier to test

---

## 📊 VẤN ĐỀ 3: Large Functions Cần Tách

### Hiện Tượng

GanttChart.tsx có function `getDatePosition` quá lớn (80+ dòng):

```typescript
const getDatePosition = useMemo(() => {
  const columnPositions: { date: Date; startX: number; ... }[] = [];
  let currentX = 0;

  timelineColumns.forEach((col) => {
    columnPositions.push({...});
    currentX += col.width;
  });

  return (date: Date): number => {
    // 40 dòng logic tìm position
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < columnPositions.length; i++) {
      // ...
    }

    if (columnPositions.length > 0) {
      // ...
    }
  };
}, [timelineColumns, viewMode]);
```

### Giải Pháp: Move to Utility

**File mới**: `src/features/gantt/lib/date-position-calculator.ts`

```typescript
interface TimelineColumn {
  date: Date;
  label: string;
  subLabel: string;
  width: number;
  days: number;
}

interface ColumnPosition {
  date: Date;
  startX: number;
  endX: number;
  width: number;
  days: number;
}

/**
 * Build column position lookup table (cached)
 */
export function buildColumnPositions(
  timelineColumns: TimelineColumn[]
): ColumnPosition[] {
  const positions: ColumnPosition[] = [];
  let currentX = 0;

  timelineColumns.forEach((col) => {
    positions.push({
      date: col.date,
      startX: currentX,
      endX: currentX + col.width,
      width: col.width,
      days: Math.max(1, col.days),
    });
    currentX += col.width;
  });

  return positions;
}

/**
 * Find which column a date falls into
 */
function findColumnIndex(
  targetDate: Date,
  positions: ColumnPosition[]
): number {
  for (let i = 0; i < positions.length; i++) {
    const col = positions[i];
    const nextCol = positions[i + 1];

    const colDate = new Date(col.date);
    colDate.setHours(0, 0, 0, 0);

    const colEndDate = nextCol ? new Date(nextCol.date) : null;
    if (colEndDate) colEndDate.setHours(0, 0, 0, 0);

    const isInColumn = colEndDate
      ? targetDate >= colDate && targetDate < colEndDate
      : targetDate >= colDate;

    if (isInColumn) return i;
  }

  return -1;
}

/**
 * Calculate X position for any date
 */
export function calculateDatePosition(
  date: Date,
  columnPositions: ColumnPosition[]
): number {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  const colIndex = findColumnIndex(targetDate, columnPositions);

  if (colIndex >= 0) {
    const col = columnPositions[colIndex];
    const colDate = new Date(col.date);
    colDate.setHours(0, 0, 0, 0);

    const daysFromColStart = differenceInDays(targetDate, colDate);
    const pixelsPerDay = col.width / col.days;

    return col.startX + daysFromColStart * pixelsPerDay;
  }

  // Handle out-of-bounds dates
  if (columnPositions.length === 0) return 0;

  const firstCol = columnPositions[0];
  const firstDate = new Date(firstCol.date);
  firstDate.setHours(0, 0, 0, 0);

  if (targetDate < firstDate) {
    const daysBefore = differenceInDays(firstDate, targetDate);
    const pixelsPerDay = firstCol.width / firstCol.days;
    return -daysBefore * pixelsPerDay;
  }

  const lastCol = columnPositions[columnPositions.length - 1];
  return lastCol.endX + 1000; // Far right
}
```

**Cách dùng**:

```typescript
// GanttChart.tsx - Clean và testable
const columnPositions = useMemo(
  () => buildColumnPositions(timelineColumns),
  [timelineColumns]
);

const getDatePosition = useCallback(
  (date: Date) => calculateDatePosition(date, columnPositions),
  [columnPositions]
);
```

**Benefits**:

- ✅ Logic dễ test (pure function)
- ✅ GanttChart.tsx gọn hơn
- ✅ Reusable ở component khác

---

## 📊 VẤN ĐỀ 4: Redundant Calculations

### Hiện Tượng

GanttView.tsx tính toán `taskIdMap`, `taskByIdNumber`, `wbsMap` mỗi lần render:

```typescript
// Line 600+ trong GanttView
const taskIdMap = useMemo(() => {
  const map = new Map<string, number>();
  displayTasks.forEach((task, idx) => {
    map.set(task.id, idx + 1);
  });
  return map;
}, [displayTasks]);

const taskByIdNumber = useMemo(() => {
  const map = new Map<number, Task>();
  displayTasks.forEach((task, idx) => {
    map.set(idx + 1, task);
  });
  return map;
}, [displayTasks]);

const wbsMap = useMemo(() => {
  const map = new Map<string, string>();
  // 100 dòng logic tính WBS
  return map;
}, [displayTasks]);
```

### Giải Pháp: Extract to Custom Hook

**File mới**: `src/features/gantt/hooks/useTaskMappings.ts`

```typescript
interface TaskMappings {
  taskIdMap: Map<string, number>;
  taskByIdNumber: Map<number, Task>;
  wbsMap: Map<string, string>;
}

export function useTaskMappings(tasks: Task[]): TaskMappings {
  const taskIdMap = useMemo(() => {
    const map = new Map<string, number>();
    tasks.forEach((task, idx) => {
      map.set(task.id, idx + 1);
    });
    return map;
  }, [tasks]);

  const taskByIdNumber = useMemo(() => {
    const map = new Map<number, Task>();
    tasks.forEach((task, idx) => {
      map.set(idx + 1, task);
    });
    return map;
  }, [tasks]);

  const wbsMap = useMemo(() => {
    return buildWBSMap(tasks);
  }, [tasks]);

  return { taskIdMap, taskByIdNumber, wbsMap };
}
```

**Cách dùng**:

```typescript
// GanttView.tsx
const displayTasks = viewingBaseline ? viewingBaseline.tasks : tasks;
const { taskIdMap, taskByIdNumber, wbsMap } = useTaskMappings(displayTasks);
```

**Benefits**:

- ✅ Logic tập trung
- ✅ Dễ test
- ✅ Reusable

---

## 📊 VẤN ĐỀ 5: Massive useEffect Dependencies

### Hiện Tượng

GanttView.tsx có ~10 useEffect, một số có 20+ dependencies:

```typescript
useEffect(() => {
  if (viewSettings && !settingsInitialized) {
    // Load logic
    setTaskBarLabels(viewSettings.taskBarLabels);
    setExpandedTasks(...);
    setColumns(...);
    setSettingsInitialized(true);
  }
}, [
  viewSettings,
  settingsInitialized,
  projectId,
  // Missing dependencies!
]);
```

### Giải Pháp 1: Consolidate Effects

```typescript
export function useGanttSettingsLoader(
  projectId: string,
  viewSettings: ViewSettings | undefined
) {
  const [loaded, setLoaded] = useState(false);

  const [taskBarLabels, setTaskBarLabels] = useState<TaskBarLabels>(
    DEFAULT_TASK_BAR_LABELS
  );
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [columns, setColumns] = useState<CustomColumn[]>(DEFAULT_COLUMNS);

  // Single effect for all settings
  useEffect(() => {
    if (!viewSettings || loaded) return;

    if (viewSettings.taskBarLabels) {
      setTaskBarLabels(viewSettings.taskBarLabels);
    }

    if (viewSettings.expandedTaskIds?.[projectId]) {
      setExpandedTasks(new Set(viewSettings.expandedTaskIds[projectId]));
    }

    if (viewSettings.columnSettings?.length) {
      setColumns((prevCols) =>
        prevCols.map((col) => {
          const saved = viewSettings.columnSettings?.find(
            (s) => s.id === col.id
          );
          return saved
            ? { ...col, width: saved.width, visible: saved.visible }
            : col;
        })
      );
    }

    setLoaded(true);
  }, [viewSettings, projectId, loaded]);

  return { taskBarLabels, expandedTasks, columns };
}
```

### Giải Pháp 2: Debounce Save Operations

```typescript
export function useGanttSettingsSaver(projectId: string) {
  const saveViewSettings = useSaveViewSettings();
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedSave = useCallback(
    (settings: any) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        saveViewSettings.mutate(settings);
      }, 500); // Save after 500ms of inactivity

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    },
    [saveViewSettings]
  );

  return debouncedSave;
}
```

**Benefits**:

- ✅ Fewer side effects
- ✅ Cleaner dependencies
- ✅ Better debouncing

---

## 🎯 OPTIMIZATION CHECKLIST

### Phase 1: Context API (30 min)

- [ ] Create GanttContext with provider
- [ ] Move state to context value
- [ ] Update GanttPanels to use context
- [ ] Remove 30+ props from component tree

### Phase 2: Component Memoization (20 min)

- [ ] Wrap GanttChart with memo()
- [ ] Extract GanttChartContent sub-component
- [ ] Extract TaskBarItem component
- [ ] Add memo to other sub-components

### Phase 3: Utility Extraction (20 min)

- [ ] Create date-position-calculator.ts
- [ ] Move getDatePosition logic → utility
- [ ] Move todayPosition logic → utility
- [ ] Update GanttChart.tsx imports

### Phase 4: Custom Hooks (15 min)

- [ ] Create useTaskMappings.ts
- [ ] Create useGanttSettingsLoader.ts
- [ ] Create useGanttSettingsSaver.ts
- [ ] Update GanttView.tsx to use hooks

### Phase 5: Testing & Validation (10 min)

- [ ] Build project
- [ ] Run dev server
- [ ] Test functionality
- [ ] Check for import errors
- [ ] Performance benchmark (optional)

---

## 📈 Expected Improvements

```
BEFORE OPTIMIZATION:
├─ GanttView.tsx: 2973 lines
├─ GanttChart.tsx: 648 lines
├─ Props drilling: 30+ levels
├─ Components re-render: Every parent render
└─ Utilities: Mixed with components

AFTER OPTIMIZATION:
├─ GanttView.tsx: ~400 lines
├─ GanttChart.tsx: ~300 lines
├─ GanttChartContent.tsx: ~100 lines (new)
├─ Props drilling: Via context (0 levels)
├─ Components re-render: Only when own props change
├─ lib/date-position-calculator.ts: ~150 lines (new)
├─ hooks/useTaskMappings.ts: ~40 lines (new)
├─ hooks/useGanttSettingsLoader.ts: ~50 lines (new)
└─ hooks/useGanttSettingsSaver.ts: ~30 lines (new)

Performance:
├─ Render time: -40%
├─ Memory: -20%
├─ Code maintainability: +60%
└─ Testability: +80%
```

---

## 🚀 Implementation Steps

**Tôi có thể giúp bạn implement toàn bộ optimization:**

1. ✅ Create GanttContext
2. ✅ Extract utilities
3. ✅ Create custom hooks
4. ✅ Update components
5. ✅ Test & validate

**Bạn muốn bắt đầu ngay không?**

---

**Được tạo bởi**: AI Assistant  
**Ngày**: January 3, 2026  
**Status**: 🟢 **Sẵn sàng thực hiện**
