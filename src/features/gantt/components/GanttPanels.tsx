import { useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import type { TaskBarLabels, CustomColumn } from '../types/gantt.types';
import { Task } from '../types/task.types';
import { GanttViewMode } from './toolbar/GanttToolbar';
import { TaskGrid } from './task-grid';
import { GanttChart, GanttChartHandle } from './gantt-chart/GanttChart';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '../components/internal/ui';
import type { TaskStatus, TaskLabel } from '../types/task.types';
import { ProjectMilestone } from '../types/gantt.types';


// Phần hiển thị chính của gantt chart
export interface GanttPanelsHandle {
  scrollToToday: () => void;  // sẽ có scroll đến toDay
}

interface GanttPanelsProps {
  flatTasks: Task[];  // danh sách task đã được flatten
  columns: CustomColumn[];  // danh sách cột
  projectMembers: { id: string; name: string }[];
  allEmployees: { id: string; name: string }[];
  selectedTaskId: string | null;
  selectedTaskIds: Set<string>;
  taskIdMap: Map<string, number>;
  wbsMap: Map<string, string>;
  taskByIdNumber: Map<number, Task>;
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
  taskStatuses: TaskStatus[];
  taskLabels: TaskLabel[];
  projectId: string;
  taskBarLabels: TaskBarLabels;
  projectMilestones: ProjectMilestone[];
  isNonWorkingDay: (date: Date) => boolean;
  isHoliday: (date: Date) => boolean;
  onSelectTask: (taskId: string | null, ctrlKey?: boolean) => void;
  onToggleExpand: (taskId: string) => void;
  onAddTask: (parentId?: string | null, afterTaskId?: string | null) => void;
  onInsertAbove: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onCopyTask: (taskId: string) => void;
  onMoveUp: (taskId: string) => void;
  onMoveDown: (taskId: string) => void;
  onUpdateField: (taskId: string, field: string, value: any) => void;
  onColumnsChange: (columns: CustomColumn[]) => void;
}

export const GanttPanels = forwardRef<GanttPanelsHandle, GanttPanelsProps>(
  (
    {
      flatTasks, // danh sách task đã được flatten
      columns, // danh sách cột
      projectMembers, // danh sách thành viên dự án
      allEmployees, // danh sách tất cả nhân viên
      selectedTaskId, // id của task đang được chọn
      selectedTaskIds, // danh sách id của task đang được chọn
      taskIdMap, // bản đồ id task
      wbsMap, // bản đồ wbs
      taskByIdNumber, // bản đồ id task theo số
      tasks,  // danh sách task
      startDate, // ngày bắt đầu
      viewMode, // chế độ xem
      timelineColumns, // danh sách cột timeline
      taskStatuses, // danh sách status task
      taskLabels, // danh sách label task
      projectId,
      taskBarLabels, // danh sách label task bar
      projectMilestones, // danh sách milestone dự án
      isNonWorkingDay, // kiểm tra xem ngày có phải là ngày nghỉ không
      isHoliday, // kiểm tra xem ngày có phải là ngày lễ không
      onSelectTask, // hàm chọn task
      onToggleExpand, // hàm toggle expand
      onAddTask, // hàm thêm task
      onInsertAbove, // hàm thêm task trên
      onEditTask, // hàm chỉnh sửa task
      onDeleteTask, // hàm xóa task
      onCopyTask, // hàm copy task
      onMoveUp, // hàm di chuyển task lên
      onMoveDown, // hàm di chuyển task xuống
      onUpdateField, // hàm cập nhật field
      onColumnsChange, // hàm cập nhật cột
    },
    ref
  ) => {
    const tableScrollRef = useRef<HTMLDivElement>(null); // ref của table
    const ganttScrollRef = useRef<HTMLDivElement>(null); // ref của gantt
    const ganttChartRef = useRef<GanttChartHandle>(null); // ref của gantt chart
    const isScrolling = useRef(false); // kiểm tra xem có scroll không

    // Expose scrollToToday method
    // hàm scrollToToday
    useImperativeHandle(
      ref, // ref của gantt chart
      () => ({
        scrollToToday: () => { // hàm scrollToToday
          ganttChartRef.current?.scrollToToday();
        },
      }),
      []
    );

    // Sync vertical scroll from table to gantt
    // hàm sync vertical scroll từ table đến gantt
    const handleTableVerticalScroll = useCallback((scrollTop: number) => {
      // kiểm tra xem có scroll không
      if (isScrolling.current) return;
      isScrolling.current = true;

      // kiểm tra xem có scroll không

      if (ganttScrollRef.current) {
        ganttScrollRef.current.scrollTop = scrollTop;
      }
      // hiển thị scroll 
      requestAnimationFrame(() => {
        isScrolling.current = false;
      });
    }, []);

    // Sync vertical scroll from gantt to table (called from GanttChart onVerticalScroll)
    // đồng bộ scroll từ gantt đến table (gọi từ GanttChart onVerticalScroll)
    const handleGanttVerticalScroll = useCallback((scrollTop: number) => {
      // kiểm tra xem có scroll không
      if (isScrolling.current) return;
      // đặt scroll là true
      isScrolling.current = true;
      // kiểm tra xem có scroll không
      if (tableScrollRef.current) {
        tableScrollRef.current.scrollTop = scrollTop;
      }
      // hiển thị scroll 
      requestAnimationFrame(() => {
        isScrolling.current = false;
      });
    }, []);

    return (
      <div className="flex-1 w-full h-full flex flex-col overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="flex-1 w-full">  
          {/* Có thể resize pannel trái (Task Grid) */}
          <ResizablePanel
            defaultSize={40}
            minSize={20}
            maxSize={60}
            className="min-h-0 max-h-[calc(100vh-240px)]" 
          >
          {/* Task Grid (Left panel) */}
          {/* Danh sách các task */}
          <TaskGrid
            tasks={flatTasks}  // danh sách task đã được flatten
            columns={columns} // danh sách cột 
            projectMembers={projectMembers} // danh sách thành viên dự án
            allEmployees={allEmployees} // danh sách tất cả nhân viên
            selectedTaskId={selectedTaskId} // id của task đang được chọn
            selectedTaskIds={selectedTaskIds} // danh sách id của task đang được chọn
            taskIdMap={taskIdMap} // bản đồ id task
            wbsMap={wbsMap} // bản đồ wbs
            taskByIdNumber={taskByIdNumber} // bản đồ id task theo số
            taskStatuses={taskStatuses} // danh sách status task
            taskLabels={taskLabels}  // danh sách label task
            projectId={projectId}  // id của dự án
            onSelectTask={onSelectTask} // hàm chọn task
            onToggleExpand={onToggleExpand} // hàm toggle expand
            onAddTask={onAddTask}  // hàm thêm task
            onInsertAbove={onInsertAbove} // hàm thêm task trên
            onEditTask={onEditTask} // hàm chỉnh sửa task
            onDeleteTask={onDeleteTask} // hàm xóa task
            onCopyTask={onCopyTask} // hàm copy task
            onMoveUp={onMoveUp} // hàm di chuyển task lên
            onMoveDown={onMoveDown} // hàm di chuyển task xuống
            onUpdateField={onUpdateField} // hàm cập nhật field
            onColumnsChange={onColumnsChange} // hàm cập nhật cột
            tasks_raw={tasks} // danh sách task
            onVerticalScroll={handleTableVerticalScroll}
            contentRef={tableScrollRef} // ref của table
          />
        </ResizablePanel>

        <ResizableHandle withHandle /> {/* Có thể resize pannel giữa (Gantt Chart) */}

        <ResizablePanel defaultSize={60} className="min-h-0 max-h-[calc(100vh-240px)]">  
          {/* Gantt Chart (Right panel) */}
          {/* Gantt Chart */}
          <GanttChart
            ref={ganttChartRef} // ref của gantt chart
            tasks={flatTasks} // danh sách task đã được flatten
            startDate={startDate} // ngày bắt đầu
            viewMode={viewMode} // chế độ xem
            timelineColumns={timelineColumns} // danh sách cột timeline
            selectedTaskId={selectedTaskId} // id của task đang được chọn
            selectedTaskIds={selectedTaskIds}  // danh sách id đã chọn
            taskIdMap={taskIdMap} // bản đồ id task
            taskBarLabels={taskBarLabels} // danh sách label task bar
            taskLabels={taskLabels} // danh sách label task
            projectMilestones={projectMilestones} // danh sách milestone dự án
            allEmployees={allEmployees} // danh sách tất cả nhân viên
            isNonWorkingDay={isNonWorkingDay} // kiểm tra xem ngày có phải là ngày nghỉ không
            isHoliday={isHoliday} // kiểm tra xem ngày có phải là ngày lễ không
            onSelectTask={onSelectTask} // hàm chọn task
            contentRef={ganttScrollRef} // ref của gantt
            onVerticalScroll={handleGanttVerticalScroll}  // hàm đồng bộ scroll từ gantt đến table (gọi từ GanttChart onVerticalScroll)
          />
        </ResizablePanel>
      </ResizablePanelGroup>
      </div>
    );
  }
);

GanttPanels.displayName = 'GanttPanels';
