import {
  useMemo,
  useRef,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from 'react';
import type { Task, TaskLabel } from '../../types/task.types';
import { ProjectMilestone } from '../../types/gantt.types';
import { TaskBarLabels } from '../../types/gantt.types';

import { GanttViewMode } from '../toolbar/GanttToolbar';
import { parseISO, differenceInDays, addDays, format } from 'date-fns';

// Import các component con
import { GanttHeader } from './GanttHeader';
import { GanttGrid } from './GanttGrid';
import { GanttTaskBar } from './GanttTaskBar';
import { GanttDependencies } from './GanttDependencies';
import { GanttMilestones } from './GanttMilestones';

export interface GanttChartHandle {
  scrollToToday: () => void;
}

interface GanttChartProps {
  tasks: Task[];
  startDate: Date;
  viewMode: GanttViewMode;
  timelineColumns: {
    date: Date;
    label: string;
    subLabel: string;
    width: number;
    days: number;
  }[];
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

export const GanttChart = forwardRef<GanttChartHandle, GanttChartProps>(
  (
    {
      tasks,
      viewMode,
      timelineColumns,
      selectedTaskIds,
      taskBarLabels,
      taskLabels,
      projectMilestones,
      allEmployees,
      isNonWorkingDay,
      isHoliday,
      onSelectTask,
      contentRef,
      onVerticalScroll,
    },
    ref
  ) => {
    const headerRef = useRef<HTMLDivElement>(null);
    const internalContentRef = useRef<HTMLDivElement>(null);
    const scrollRef = contentRef || internalContentRef;

    // --- 1. TÍNH TOÁN TỔNG WIDTH ---
    const totalWidth = useMemo(() => {
      return timelineColumns.reduce((sum, col) => sum + col.width, 0);
    }, [timelineColumns]);

    // --- 2. PRE-CALCULATE PIXEL MAP (TỐI ƯU HÓA) ---
    // Tạo map ánh xạ 'yyyy-MM-dd' -> vị trí pixel X
    const dateToPixelMap = useMemo(() => {
      const map = new Map<string, number>();
      let currentX = 0;

      timelineColumns.forEach((col) => {
        const pixelsPerDay = col.width / Math.max(1, col.days);
        
        // Loop qua số ngày trong cột để map từng ngày cụ thể
        for (let i = 0; i < col.days; i++) {
          const currentDate = addDays(col.date, i);
          const key = format(currentDate, 'yyyy-MM-dd');
          // Lưu vị trí chính xác của ngày đó
          map.set(key, currentX + (i * pixelsPerDay));
        }
        
        currentX += col.width;
      });

      return map;
    }, [timelineColumns]);

    // --- 3. HÀM LẤY VỊ TRÍ O(1) ---
    const getDatePosition = useCallback((date: Date): number => {
      const targetDate = new Date(date);
      const key = format(targetDate, 'yyyy-MM-dd');
      
      // A. Nếu ngày nằm trong map (trong vùng hiển thị) -> Trả về ngay lập tức
      const pos = dateToPixelMap.get(key);
      if (pos !== undefined) return pos;

      // B. Fallback: Nếu ngày nằm ngoài vùng hiển thị (trước hoặc sau timeline)
      if (timelineColumns.length === 0) return 0;

      const firstCol = timelineColumns[0];
      const firstDate = firstCol.date;
      
      // Nếu ngày < ngày bắt đầu timeline
      if (targetDate < firstDate) {
        const daysBefore = differenceInDays(firstDate, targetDate); // daysBefore > 0
        const pixelsPerDay = firstCol.width / Math.max(1, firstCol.days);
        return -(daysBefore * pixelsPerDay);
      }

      // Nếu ngày > ngày kết thúc timeline
      // Lấy cột cuối cùng để tính pixel/day
      const lastCol = timelineColumns[timelineColumns.length - 1];
      const lastDateInCol = addDays(lastCol.date, lastCol.days); // Ngày kết thúc thực tế
      
      const daysAfter = differenceInDays(targetDate, lastDateInCol);
      // Vị trí bắt đầu tính từ totalWidth (cuối timeline)
      // Cộng thêm khoảng cách dư thừa
      const pixelsPerDay = lastCol.width / Math.max(1, lastCol.days);
      return totalWidth + (daysAfter * pixelsPerDay);

    }, [dateToPixelMap, timelineColumns, totalWidth]);

    // --- 4. TÍNH VỊ TRÍ TODAY ---
    const todayPosition = useMemo(() => {
      const today = new Date();
      // Không cần setHours vì format 'yyyy-MM-dd' tự xử lý, 
      // nhưng giữ logic cũ để đảm bảo tính toán chính xác nếu cần
      today.setHours(0, 0, 0, 0); 
      
      const pos = getDatePosition(today);
      
      // Nếu today nằm quá xa ngoài vùng view thì không render line
      if (pos < -100 || pos > totalWidth + 100) return null;
      
      // Lấy độ rộng của 1 ngày tại thời điểm today
      // (Dùng getDatePosition cho ngày mai - hôm nay)
      const nextDayPos = getDatePosition(addDays(today, 1));
      const dayWidth = Math.max(1, nextDayPos - pos);
      
      return pos + dayWidth / 2;
    }, [getDatePosition, totalWidth]);

    // --- SCROLL HANDLER ---
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
      },
    }), [todayPosition, scrollRef]);

    // --- HELPER FUNCTIONS ---
    const getTaskPosition = (task: Task) => {
      if (!task.start_date || !task.end_date) return null;
      const taskStart = parseISO(task.start_date);
      const taskEnd = parseISO(task.end_date);
      
      const left = getDatePosition(taskStart);
      const endExclusive = addDays(taskEnd, 1);
      const right = getDatePosition(endExclusive);
      
      const width = right - left;
      
      // Chỉ ẩn nếu hoàn toàn nằm ngoài viewport (cải thiện rendering)
      if (left + width < 0 || left > totalWidth) return null;
      
      return { left, width: Math.max(1, width) };
    };

    const hasChildren = (taskId: string) => tasks.some((t) => t.parent_id === taskId);

    const getLastName = (fullName: string) => {
      const parts = fullName.trim().split(/\s+/);
      return parts[parts.length - 1] || fullName;
    };

    const getAssigneeNames = (task: Task) => {
      if (!task.assignees || task.assignees.length === 0) return '';
      return task.assignees
        .map((id) => {
          const employee = allEmployees.find((e) => e.id === id);
          return employee ? getLastName(employee.name) : '';
        })
        .filter(Boolean)
        .join(', ');
    };

    const handleContentScroll = (e: React.UIEvent<HTMLDivElement>) => {
      if (headerRef.current) {
        headerRef.current.scrollLeft = e.currentTarget.scrollLeft;
      }
      onVerticalScroll?.(e.currentTarget.scrollTop);
    };

    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* 1. Header Component */}
        <GanttHeader
          ref={headerRef}
          timelineColumns={timelineColumns}
          totalWidth={totalWidth}
          viewMode={viewMode}
          isNonWorkingDay={isNonWorkingDay}
          isHoliday={isHoliday}
        />

        {/* 2. Scrollable Content */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-auto scrollbar-thin"
          onScroll={handleContentScroll}
        >
          <div
            style={{ minWidth: totalWidth, minHeight: tasks.length * 28 }}
            className="relative"
          >
            {/* 3. Grid Lines */}
            <GanttGrid
              timelineColumns={timelineColumns.map(c => ({ date: c.date, width: c.width }))}
              viewMode={viewMode}
              isNonWorkingDay={isNonWorkingDay}
              isHoliday={isHoliday}
            />

            {/* 4. Tasks Render Loop */}
            {tasks.map((task, idx) => (
              <GanttTaskBar
                key={task.id}
                task={task}
                index={idx}
                position={getTaskPosition(task)}
                isSelected={selectedTaskIds.has(task.id)}
                isGroup={hasChildren(task.id)}
                taskBarLabels={taskBarLabels}
                taskLabelConfig={task.label_id ? taskLabels.find(l => l.id === task.label_id) : taskLabels.find(l => l.is_default)}
                getAssigneeNames={getAssigneeNames}
                onSelect={onSelectTask}
              />
            ))}

            {/* 5. Dependencies Overlay */}
            <GanttDependencies tasks={tasks} getDatePosition={getDatePosition} />

            {/* 6. Milestones Overlay */}
            <GanttMilestones 
              milestones={projectMilestones} 
              getDatePosition={getDatePosition} 
              totalWidth={totalWidth} 
            />

            {/* 7. Today Marker */}
            {todayPosition !== null && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
                style={{ left: todayPosition }}
              >
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-red-500" />
              </div>
            )}
          </div>

          {/* Empty State */}
          {tasks.length === 0 && (
            <div className="flex items-center justify-center h-[calc(100vh-300px)] min-h-[200px] text-muted-foreground text-xs">
              Thêm task để xem biểu đồ Gantt
            </div>
          )}
        </div>
      </div>
    );
  }
);

GanttChart.displayName = 'GanttChart';