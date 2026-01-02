/**
 * GanttChart Page - Temporary Wrapper
 * 
 * TODO: This is a temporary wrapper that re-exports the old GanttView component.
 * Gradually migrate logic to use new architecture:
 * - Replace old hooks with feature/gantt hooks
 * - Extract components to components/ folder
 * - Use Zustand store instead of local state
 * - Break down into smaller, testable components
 */

// Temporary: Re-export old component
export { GanttView as GanttChart } from '@/components/gantt/GanttView';
export type { GanttViewMode } from '@/components/gantt/GanttView';

// When ready to migrate, use this structure:
/*
import { useGetTasks } from '../hooks/queries/useTaskQueries';
import { useGanttStore } from '../store/gantt.store';
import { buildTaskTree, flattenTaskTree } from '../lib/tree-utils';
import { generateTimelineColumns } from '../lib/gantt-utils';

interface GanttChartProps {
  projectId: string;
  projectMembers: { id: string; name: string }[];
  holidays: any[];
  settings: any;
}

export function GanttChart({ projectId, projectMembers, holidays, settings }: GanttChartProps) {
  // Use new hooks from feature/gantt
  const { data: tasks = [] } = useGetTasks(projectId);
  const {
    viewMode,
    startDate,
    expandedTasks,
    selectedTasks,
  } = useGanttStore();

  // Build task tree using utilities
  const taskTree = buildTaskTree(tasks);
  const flatTasks = flattenTaskTree(taskTree, expandedTasks);
  const timelineColumns = generateTimelineColumns(startDate, endDate, viewMode);

  return (
    <div className="gantt-chart">
      <GanttToolbar />
      <div className="gantt-content">
        <TaskListTable tasks={flatTasks} />
        <ChartArea 
          tasks={flatTasks}
          timelineColumns={timelineColumns}
        />
      </div>
    </div>
  );
}
*/
