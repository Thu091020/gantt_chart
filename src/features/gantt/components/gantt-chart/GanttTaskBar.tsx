import { Task } from '../../types/task.types';
import { TaskLabel } from '../../types/task.types';
import { TaskBarLabels } from '../../types/gantt.types';
import { cn } from '../../components/internal/utils';
import { parseISO, format } from 'date-fns';

interface GanttTaskBarProps {
  task: Task;
  index: number;
  position: { left: number; width: number } | null;
  isSelected: boolean;
  isGroup: boolean;
  taskBarLabels: TaskBarLabels;
  taskLabelConfig?: TaskLabel;
  getAssigneeNames: (task: Task) => string;
  onSelect: (taskId: string, ctrlKey: boolean) => void;
}

export const GanttTaskBar = ({
  task,
  index,
  position,
  isSelected,
  isGroup,
  taskBarLabels,
  taskLabelConfig,
  getAssigneeNames,
  onSelect,
}: GanttTaskBarProps) => {
  if (!position) return null;

  const isBold = task.text_style === 'bold' || task.text_style === 'bold-italic';
  const isItalic = task.text_style === 'italic' || task.text_style === 'bold-italic';
  const textStyleClasses = cn(isBold && 'font-bold', isItalic && 'italic');

  const getOutsideLabel = () => {
    const parts: string[] = [];
    if (taskBarLabels.showAssignees) {
      const assignees = getAssigneeNames(task);
      if (assignees) parts.push(assignees);
    }
    if (taskBarLabels.showDuration && task.duration) parts.push(`${task.duration}d`);
    if (taskBarLabels.showDates && task.start_date && task.end_date) {
      parts.push(
        `${format(parseISO(task.start_date), 'dd/MM')} - ${format(parseISO(task.end_date), 'dd/MM')}`
      );
    }
    return parts.join(' | ');
  };

  const labelColor = taskLabelConfig?.color || '#3b82f6';

  return (
    <div
      className={cn(
        'relative border-b border-border/30 hover:bg-secondary/20 cursor-pointer z-10', // z-10 to stay above grid/dependencies
        isSelected && 'bg-sky-500/15',
        !isSelected && index % 2 !== 0 && 'bg-secondary/5'
      )}
      style={{ height: 28 }}
      onClick={(e) => onSelect(task.id, e.ctrlKey || e.metaKey)}
    >
      {/* 1. GROUP TASK */}
      {isGroup ? (
        <>
          {taskBarLabels.showName && (
            <span
              className={cn('absolute top-0 text-[9px] text-muted-foreground font-medium truncate whitespace-nowrap', textStyleClasses)}
              style={{ left: position.left + 10 }}
            >
              {task.name}
            </span>
          )}
          <div
            className="absolute top-1.5 flex items-center"
            style={{ left: position.left, width: position.width - 2 }}
            title={`${task.name}\n${task.start_date} - ${task.end_date}`}
          >
            <div className="w-1.5 h-4 bg-indigo-600 rounded-l-sm" />
            <div className="flex-1 h-2 bg-indigo-600" />
            <div className="w-1.5 h-4 bg-indigo-600 rounded-r-sm" />
          </div>
          {/* Group Outside Label */}
          {(taskBarLabels.showDuration || taskBarLabels.showDates) && (
             <span
             className={cn('absolute top-1 h-4 flex items-center text-[9px] text-muted-foreground whitespace-nowrap pl-1', textStyleClasses)}
             style={{ left: position.left + position.width }}
           >
             {getOutsideLabel()}
           </span>
          )}
        </>
      ) : task.is_milestone ? (
        // 2. MILESTONE TASK (Diamond shape)
        <div
          className="absolute w-4 h-4 rotate-45 bg-amber-500 top-1.5"
          style={{ left: position.left }}
          title={`${task.name}\n${task.start_date} - ${task.end_date}`}
        />
      ) : (
        // 3. NORMAL TASK (Bar with progress)
        <>
          <div
            className="absolute top-1 h-4 rounded transition-all"
            style={{
              left: position.left,
              width: position.width - 2,
              backgroundColor: `${labelColor}cc`,
            }}
            title={`${task.name}\n${task.start_date} - ${task.end_date}`}
          >
            {task.progress > 0 && (
              <div
                className="absolute inset-y-0 left-0 rounded-l"
                style={{ width: `${task.progress}%`, backgroundColor: labelColor }}
              />
            )}
            {taskBarLabels.showName && position.width > 40 && (
              <span className={cn('absolute inset-0 flex items-center px-1.5 text-[9px] text-white font-medium truncate', textStyleClasses)}>
                {task.name}
              </span>
            )}
          </div>
          {/* Outside Labels */}
          {(taskBarLabels.showAssignees || taskBarLabels.showDuration || taskBarLabels.showDates) && (
            <span
              className={cn('absolute top-1 h-4 flex items-center text-[9px] text-muted-foreground whitespace-nowrap pl-1', textStyleClasses)}
              style={{ left: position.left + position.width }}
            >
              {getOutsideLabel()}
            </span>
          )}
        </>
      )}
    </div>
  );
};