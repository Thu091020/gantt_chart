import { useMemo, useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import type { Task, TaskLabel, ProjectMilestone, TaskBarLabels } from '../../types/gantt.types';
import { GanttViewMode } from '../toolbar/GanttToolbar';
import { cn } from '../internal/utils';
import { format, parseISO, differenceInDays, isSameDay, isSaturday, isSunday, addDays } from 'date-fns';
import { vi } from 'date-fns/locale';

export interface GanttChartHandle {
  scrollToToday: () => void;
}

interface GanttChartProps {
  tasks: Task[];
  startDate: Date;
  viewMode: GanttViewMode;
  timelineColumns: { date: Date; label: string; subLabel: string; width: number; days: number }[];
  selectedTaskId: string | null;
  selectedTaskIds: Set<string>;
  taskIdMap: Map<string, number>;
  taskBarLabels: TaskBarLabels;
  taskLabels: TaskLabel[];
  projectMilestones: ProjectMilestone[];
  allEmployees: { id: string; name: string }[];
  isNonWorkingDay: (date: Date) => boolean;
  isHoliday: (date: Date) => boolean;
  onSelectTask: (taskId: string | null, ctrlKey?: boolean) => void;
  contentRef?: React.RefObject<HTMLDivElement>;
  onVerticalScroll?: (scrollTop: number) => void;
}

export const GanttChart = forwardRef<GanttChartHandle, GanttChartProps>(({
  tasks,
  startDate,
  viewMode,
  timelineColumns,
  selectedTaskId,
  selectedTaskIds,
  taskIdMap,
  taskBarLabels,
  taskLabels,
  projectMilestones,
  allEmployees,
  isNonWorkingDay,
  isHoliday,
  onSelectTask,
  contentRef,
  onVerticalScroll
}, ref) => {
  const headerRef = useRef<HTMLDivElement>(null);
  const internalContentRef = useRef<HTMLDivElement>(null);
  const scrollRef = contentRef || internalContentRef;

  // Calculate total width from timeline columns
  const totalWidth = useMemo(() => {
    return timelineColumns.reduce((sum, col) => sum + col.width, 0);
  }, [timelineColumns]);

  // Build a lookup to find position for any date based on timeline columns
  const getDatePosition = useMemo(() => {
    // For each column, calculate its start position
    const columnPositions: { date: Date; startX: number; endX: number; width: number; days: number }[] = [];
    let currentX = 0;
    
    timelineColumns.forEach((col) => {
      columnPositions.push({
        date: col.date,
        startX: currentX,
        endX: currentX + col.width,
        width: col.width,
        days: Math.max(1, col.days),
      });
      currentX += col.width;
    });
    
    return (date: Date): number => {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      
      // Find which column this date falls into
      for (let i = 0; i < columnPositions.length; i++) {
        const col = columnPositions[i];
        const nextCol = columnPositions[i + 1];
        const colDate = new Date(col.date);
        colDate.setHours(0, 0, 0, 0);
        
        const colEndDate = nextCol ? new Date(nextCol.date) : null;
        if (colEndDate) colEndDate.setHours(0, 0, 0, 0);
        
        // Check if date is within this column's range
        const isInColumn = colEndDate 
          ? targetDate >= colDate && targetDate < colEndDate
          : targetDate >= colDate;
        
        if (isInColumn) {
          // Calculate position within the column
          const daysFromColStart = differenceInDays(targetDate, colDate);
          const pixelsPerDay = col.width / col.days;
          return col.startX + (daysFromColStart * pixelsPerDay);
        }
      }
      
      // If date is before all columns
      if (columnPositions.length > 0) {
        const firstCol = columnPositions[0];
        const firstDate = new Date(firstCol.date);
        firstDate.setHours(0, 0, 0, 0);
        
        if (targetDate < firstDate) {
          const daysBefore = differenceInDays(firstDate, targetDate);
          const pixelsPerDay = firstCol.width / firstCol.days;
          return -daysBefore * pixelsPerDay;
        }
        
        // If date is after all columns
        const lastCol = columnPositions[columnPositions.length - 1];
        const lastDate = new Date(lastCol.date);
        lastDate.setHours(0, 0, 0, 0);
        const daysAfterLastCol = differenceInDays(targetDate, lastDate);
        const pixelsPerDay = lastCol.width / lastCol.days;
        return lastCol.startX + (daysAfterLastCol * pixelsPerDay);
      }
      
      return 0;
    };
  }, [timelineColumns, viewMode]);

  // Calculate today's position
  const todayPosition = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pos = getDatePosition(today);
    if (pos < 0 || pos > totalWidth) return null;

    // Center inside the day cell for correct alignment in week/month modes
    const nextPos = getDatePosition(addDays(today, 1));
    const dayWidth = Math.max(1, nextPos - pos);
    return pos + dayWidth / 2;
  }, [getDatePosition, totalWidth]);

  // Expose scrollToToday method
  useImperativeHandle(ref, () => ({
    scrollToToday: () => {
      if (scrollRef.current && todayPosition !== null) {
        const containerWidth = scrollRef.current.clientWidth;
        const scrollLeft = todayPosition - containerWidth / 2;
        scrollRef.current.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
        if (headerRef.current) {
          headerRef.current.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
        }
      }
    }
  }), [todayPosition, scrollRef]);

  const getTaskPosition = (task: Task) => {
    if (!task.start_date || !task.end_date) return null;

    const taskStart = parseISO(task.start_date);
    const taskEnd = parseISO(task.end_date);

    const left = getDatePosition(taskStart);

    // Use end-exclusive position (end date is inclusive in UI)
    const endExclusive = addDays(taskEnd, 1);
    const right = getDatePosition(endExclusive);

    const width = right - left;

    if (left + width < 0 || left > totalWidth) return null;

    return { left, width: Math.max(1, width) };
  };

  const hasChildren = (taskId: string) => {
    return tasks.some(t => t.parent_id === taskId);
  };

  // Get last name only from full name (Vietnamese: last word is first name)
  const getLastName = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    return parts[parts.length - 1] || fullName;
  };

  // Get assignee names for a task (last names only)
  const getAssigneeNames = (task: Task) => {
    if (!task.assignees || task.assignees.length === 0) return '';
    return task.assignees
      .map(id => {
        const employee = allEmployees.find(e => e.id === id);
        return employee ? getLastName(employee.name) : '';
      })
      .filter(Boolean)
      .join(', ');
  };

  // Build label text for OUTSIDE the task bar
  const getOutsideLabel = (task: Task) => {
    const parts: string[] = [];
    if (taskBarLabels.showAssignees) {
      const assignees = getAssigneeNames(task);
      if (assignees) parts.push(assignees);
    }
    if (taskBarLabels.showDuration && task.duration) {
      parts.push(`${task.duration}d`);
    }
    if (taskBarLabels.showDates && task.start_date && task.end_date) {
      parts.push(`${format(parseISO(task.start_date), 'dd/MM')} - ${format(parseISO(task.end_date), 'dd/MM')}`);
    }
    return parts.join(' | ');
  };

  // Sync horizontal scroll between header and content + vertical scroll callback
  const handleContentScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (headerRef.current) {
      headerRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
    // Notify parent about vertical scroll
    onVerticalScroll?.(e.currentTarget.scrollTop);
  };

  // totalWidth is already calculated in useMemo above

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Timeline header - fixed at top, scrolls horizontally with content */}
      <div 
        ref={headerRef}
        className="bg-secondary/50 border-b border-border overflow-hidden shrink-0" 
        style={{ height: 42 }}
      >
        <div className="flex h-full" style={{ minWidth: totalWidth }}>
          {timelineColumns.map((col, idx) => (
            <div
              key={idx}
              className={cn(
                'text-center border-r border-border/50 text-[9px] flex flex-col items-center justify-center h-full',
                viewMode === 'day' && isNonWorkingDay(col.date) && 'bg-muted-foreground/20',
                viewMode === 'day' && isHoliday(col.date) && 'bg-muted-foreground/30',
                viewMode === 'day' && isSameDay(col.date, new Date()) && 'bg-primary/20'
              )}
              style={{ width: col.width, minWidth: col.width }}
            >
              <div className="text-muted-foreground leading-tight">{col.subLabel}</div>
              <div className="font-medium leading-tight">{col.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Task bars - scrollable both horizontally and vertically */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-auto scrollbar-thin"
        onScroll={handleContentScroll}
      >
        <div style={{ minWidth: totalWidth, minHeight: tasks.length * 28 }} className="relative">
          {/* Grid lines */}
          <div className="absolute inset-0 flex pointer-events-none">
            {timelineColumns.map((col, idx) => (
              <div
                key={idx}
                className={cn(
                  'border-r border-border/30 h-full',
                  viewMode === 'day' && isNonWorkingDay(col.date) && 'bg-muted-foreground/10',
                  viewMode === 'day' && isHoliday(col.date) && 'bg-orange-500/10',
                  viewMode === 'day' && isSameDay(col.date, new Date()) && 'bg-primary/5'
                )}
                style={{ width: col.width, minWidth: col.width }}
              />
            ))}
          </div>

          {/* Task rows */}
          {tasks.map((task, idx) => {
            const position = getTaskPosition(task);
            const isGroup = hasChildren(task.id);
            
            // Get text style classes for this task
            const isBold = task.text_style === 'bold' || task.text_style === 'bold-italic';
            const isItalic = task.text_style === 'italic' || task.text_style === 'bold-italic';
            const textStyleClasses = cn(isBold && 'font-bold', isItalic && 'italic');
            
            return (
              <div
                key={task.id}
                className={cn(
                  'relative border-b border-border/30 hover:bg-secondary/20 cursor-pointer',
                  selectedTaskIds.has(task.id) && 'bg-sky-500/15',
                  selectedTaskIds.size === 0 && idx % 2 !== 0 && 'bg-secondary/5'
                )}
                style={{ height: 28 }}
                onClick={(e) => onSelectTask(task.id, e.ctrlKey || e.metaKey)}
              >
                {position && (
                  <>
                    {/* Group task with hooks */}
                    {isGroup ? (
                      <>
                        {/* Task name on top of group bar */}
                        {taskBarLabels.showName && (
                          <span 
                            className={cn("absolute top-0 text-[9px] text-muted-foreground font-medium truncate whitespace-nowrap", textStyleClasses)}
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
                          {/* Left hook */}
                          <div className="w-1.5 h-4 bg-indigo-600 rounded-l-sm" />
                          {/* Center bar */}
                          <div className="flex-1 h-2 bg-indigo-600" />
                          {/* Right hook */}
                          <div className="w-1.5 h-4 bg-indigo-600 rounded-r-sm" />
                        </div>
                        {/* Outside labels for group */}
                        {(taskBarLabels.showDuration || taskBarLabels.showDates) && (
                          <span 
                            className={cn("absolute top-1 h-4 flex items-center text-[9px] text-muted-foreground whitespace-nowrap pl-1", textStyleClasses)}
                            style={{ left: position.left + position.width }}
                          >
                            {getOutsideLabel(task)}
                          </span>
                        )}
                      </>
                    ) : task.is_milestone ? (
                      <div
                        className="absolute w-4 h-4 rotate-45 bg-amber-500 top-1.5"
                        style={{ left: position.left }}
                        title={`${task.name}\n${task.start_date} - ${task.end_date}`}
                      />
                    ) : (
                      (() => {
                        // Get task label color
                        const taskLabel = task.label_id 
                          ? taskLabels.find(l => l.id === task.label_id)
                          : taskLabels.find(l => l.is_default);
                        const labelColor = taskLabel?.color || '#3b82f6';
                        
                        // Create darker shade for progress bar
                        const progressColor = labelColor;
                        
                        return (
                          <div
                            className="absolute top-1 h-4 rounded transition-all"
                            style={{
                              left: position.left,
                              width: position.width - 2,
                              backgroundColor: `${labelColor}cc`, // 80% opacity
                            }}
                            title={`${task.name}\n${task.start_date} - ${task.end_date}`}
                          >
                            {/* Progress bar */}
                            {task.progress > 0 && (
                              <div
                                className="absolute inset-y-0 left-0 rounded-l"
                                style={{ 
                                  width: `${task.progress}%`,
                                  backgroundColor: progressColor,
                                }}
                              />
                            )}
                            
                            {/* Task name label - inside bar */}
                            {taskBarLabels.showName && position.width > 40 && (
                              <span className={cn("absolute inset-0 flex items-center px-1.5 text-[9px] text-white font-medium truncate", textStyleClasses)}>
                                {task.name}
                              </span>
                            )}
                          </div>
                        );
                      })()
                    )}
                    
                    {/* Outside labels - to the right of task bar (for normal tasks only) */}
                    {position && !task.is_milestone && !isGroup && (taskBarLabels.showAssignees || taskBarLabels.showDuration || taskBarLabels.showDates) && (
                      <span 
                        className={cn("absolute top-1 h-4 flex items-center text-[9px] text-muted-foreground whitespace-nowrap pl-1", textStyleClasses)}
                        style={{ left: position.left + position.width }}
                      >
                        {getOutsideLabel(task)}
                      </span>
                    )}
                  </>
                )}

                {/* Dependency arrows */}
                {task.predecessors?.map(predId => {
                  const predecessor = tasks.find(t => t.id === predId);
                  if (!predecessor?.end_date || !task.start_date) return null;
                  
                  const predEnd = parseISO(predecessor.end_date);
                  const taskStart = parseISO(task.start_date);
                  
                   // Use end-exclusive position for inclusive day rendering
                   const predX = getDatePosition(addDays(predEnd, 1));
                   const taskX = getDatePosition(taskStart);
                  
                  const predRow = tasks.findIndex(t => t.id === predId);
                  const currentRow = idx;
                  
                  if (predRow === -1) return null;
                  
                  return (
                    <svg
                      key={predId}
                      className="absolute pointer-events-none"
                      style={{
                        left: Math.min(predX, taskX) - 10,
                        top: predRow < currentRow ? -((currentRow - predRow) * 28 - 14) : 14,
                        width: Math.abs(taskX - predX) + 20,
                        height: Math.abs(currentRow - predRow) * 28
                      }}
                    >
                      <path
                        d={`M ${predX - Math.min(predX, taskX) + 10} ${predRow < currentRow ? 0 : Math.abs(currentRow - predRow) * 28} 
                            L ${predX - Math.min(predX, taskX) + 15} ${predRow < currentRow ? 0 : Math.abs(currentRow - predRow) * 28}
                            L ${predX - Math.min(predX, taskX) + 15} ${predRow < currentRow ? Math.abs(currentRow - predRow) * 28 : 0}
                            L ${taskX - Math.min(predX, taskX) + 10} ${predRow < currentRow ? Math.abs(currentRow - predRow) * 28 : 0}`}
                        fill="none"
                        stroke="hsl(var(--muted-foreground))"
                        strokeWidth="1"
                        markerEnd="url(#arrowhead)"
                      />
                    </svg>
                  );
                })}
              </div>
            );
          })}

          {/* Project Milestones - purple dashed vertical lines */}
          {projectMilestones.map(milestone => {
            const milestoneDate = parseISO(milestone.date);
            const pos = getDatePosition(milestoneDate);
            
            // Check if milestone is within visible range
            if (pos < 0 || pos > totalWidth) return null;
            
            // Center in the day
            const nextPos = getDatePosition(addDays(milestoneDate, 1));
            const dayWidth = Math.max(1, nextPos - pos);
            const centerPos = pos + dayWidth / 2;
            
            return (
              <div
                key={milestone.id}
                className="absolute top-0 bottom-0 z-10 group cursor-pointer"
                style={{ left: centerPos - 1 }}
              >
                {/* Dashed line */}
                <div 
                  className="w-0.5 h-full"
                  style={{
                    backgroundImage: `repeating-linear-gradient(to bottom, ${milestone.color} 0px, ${milestone.color} 6px, transparent 6px, transparent 12px)`,
                  }}
                />
                {/* Tooltip */}
                <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                  <div 
                    className="px-2 py-1 rounded text-xs text-white whitespace-nowrap shadow-lg"
                    style={{ backgroundColor: milestone.color }}
                  >
                    <div className="font-medium">{milestone.name}</div>
                    <div className="text-[10px] opacity-80">
                      {format(milestoneDate, 'dd/MM/yyyy')}
                    </div>
                    {milestone.description && (
                      <div className="text-[10px] opacity-80 mt-0.5 max-w-[150px] truncate">
                        {milestone.description}
                      </div>
                    )}
                  </div>
                </div>
                {/* Diamond marker at top */}
                <div 
                  className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45"
                  style={{ backgroundColor: milestone.color }}
                />
              </div>
            );
          })}

          {/* Today's red vertical line */}
          {todayPosition !== null && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
              style={{ left: todayPosition }}
            >
              {/* Triangle marker at top */}
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-red-500" />
            </div>
          )}

          {/* Arrow marker definition */}
          <svg className="absolute w-0 h-0">
            <defs>
              <marker
                id="arrowhead"
                markerWidth="6"
                markerHeight="6"
                refX="5"
                refY="3"
                orient="auto"
              >
                <polygon
                  points="0 0, 6 3, 0 6"
                  fill="hsl(var(--muted-foreground))"
                />
              </marker>
            </defs>
          </svg>
        </div>

        {/* Empty state */}
        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-[calc(100vh-300px)] min-h-[200px] text-muted-foreground text-xs">
            Thêm task để xem biểu đồ Gantt
          </div>
        )}
      </div>
    </div>
  );
});

GanttChart.displayName = 'GanttChart';