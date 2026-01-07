import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  useTasks,
  useAddTask,
  useUpdateTask,
  useDeleteTask,
  useBulkUpdateTasks,
  Task,
} from '@/hooks/useTasks';
import { useBulkSetAllocations, useAllocations } from '@/hooks/useAllocations';
import { supabase } from '@/integrations/supabase/client';
import { useEmployees } from '@/hooks/useEmployees';
import { useTaskStatuses } from '@/hooks/useTaskStatuses';
import { useTaskLabels, TaskLabel } from '@/hooks/useTaskLabels';
import {
  useProjectMilestones,
  ProjectMilestone,
} from '@/hooks/useProjectMilestones';
import {
  useViewSettings,
  useSaveViewSettings,
  TaskBarLabels,
} from '@/hooks/useViewSettings';
import { useUpdateProject } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { GanttPanels, GanttPanelsHandle } from './GanttPanels';
import { GanttToolbar, GanttViewMode } from './GanttToolbar';
import { TaskFormDialog } from './TaskFormDialog';
import { BaselineDialog } from './BaselineDialog';
import { useRestoreBaseline } from '@/hooks/useBaselines';

import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  format,
  addDays,
  addMonths,
  startOfMonth,
  subWeeks,
  eachDayOfInterval,
  differenceInDays,
  parseISO,
  isSaturday,
  isSunday,
  addBusinessDays,
} from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Eye, ArrowLeft, RotateCcw, Loader2 } from 'lucide-react';

interface GanttViewProps {
  projectId: string;
  projectMembers: { id: string; name: string }[];
  holidays: {
    id: string;
    date: string;
    end_date: string | null;
    name: string;
    is_recurring: boolean;
  }[];
  settings: any;
}

export type { GanttViewMode } from './GanttToolbar';

export interface CustomColumn {
  id: string;
  name: string;
  width: number;
  visible: boolean;
  fixed?: boolean;
}

const DEFAULT_COLUMNS: CustomColumn[] = [
  { id: 'task_id', name: 'ID', width: 40, visible: true, fixed: true },
  { id: 'wbs', name: 'WBS', width: 65, visible: true, fixed: true },
  { id: 'name', name: 'Tên task', width: 180, visible: true, fixed: true },
  { id: 'status', name: 'Trạng thái', width: 95, visible: true },
  { id: 'start_date', name: 'Bắt đầu', width: 85, visible: true },
  { id: 'end_date', name: 'Kết thúc', width: 85, visible: true },
  { id: 'duration', name: 'Duration', width: 65, visible: true },
  { id: 'predecessors', name: 'Predec', width: 60, visible: true },
  { id: 'assignees', name: 'Assign', width: 100, visible: true },
  { id: 'effort', name: 'Effort', width: 55, visible: true },
  { id: 'progress', name: 'Tiến độ', width: 70, visible: true },
  { id: 'label', name: 'Label', width: 85, visible: true },
];

// Fake data for demonstration - realistic project with hierarchical structure
interface FakeTaskDef {
  name: string;
  duration: number;
  progress: number;
  isGroup?: boolean; // true = group task (will have children)
  parentIndex?: number; // index of parent task (for child tasks)
  predecessorOffsets?: number[]; // relative to previous tasks
}

const FAKE_TASKS_DEFS: FakeTaskDef[] = [
  // Phase 1: Khởi động dự án (GROUP)
  { name: '1. Khởi động dự án', duration: 3, progress: 100, isGroup: true },
  { name: '1.1 Kick-off meeting', duration: 1, progress: 100, parentIndex: 0 },
  {
    name: '1.2 Thiết lập team & công cụ',
    duration: 2,
    progress: 100,
    parentIndex: 0,
    predecessorOffsets: [-1],
  },

  // Phase 2: Phân tích nghiệp vụ (GROUP)
  {
    name: '2. Phân tích nghiệp vụ (BA)',
    duration: 20,
    progress: 85,
    isGroup: true,
    predecessorOffsets: [-1],
  },
  { name: '2.1 Thu thập yêu cầu', duration: 5, progress: 100, parentIndex: 3 },
  {
    name: '2.2 Phân tích hiện trạng',
    duration: 4,
    progress: 100,
    parentIndex: 3,
    predecessorOffsets: [-1],
  },
  {
    name: '2.3 Viết SRS',
    duration: 6,
    progress: 90,
    parentIndex: 3,
    predecessorOffsets: [-1],
  },
  {
    name: '2.4 Review & approval SRS',
    duration: 2,
    progress: 80,
    parentIndex: 3,
    predecessorOffsets: [-1],
  },
  {
    name: '2.5 Thiết kế UI/UX wireframe',
    duration: 5,
    progress: 70,
    parentIndex: 3,
    predecessorOffsets: [-2],
  },
  {
    name: '2.6 Review wireframe',
    duration: 2,
    progress: 60,
    parentIndex: 3,
    predecessorOffsets: [-1],
  },

  // Phase 3: Thiết kế hệ thống (GROUP)
  {
    name: '3. Thiết kế hệ thống',
    duration: 18,
    progress: 50,
    isGroup: true,
    predecessorOffsets: [-1],
  },
  {
    name: '3.1 Thiết kế kiến trúc',
    duration: 4,
    progress: 70,
    parentIndex: 10,
  },
  {
    name: '3.2 Thiết kế database',
    duration: 5,
    progress: 60,
    parentIndex: 10,
    predecessorOffsets: [-1],
  },
  {
    name: '3.3 Thiết kế API',
    duration: 4,
    progress: 50,
    parentIndex: 10,
    predecessorOffsets: [-1],
  },
  {
    name: '3.4 Thiết kế UI chi tiết',
    duration: 6,
    progress: 40,
    parentIndex: 10,
    predecessorOffsets: [-3],
  },
  {
    name: '3.5 Review thiết kế',
    duration: 2,
    progress: 30,
    parentIndex: 10,
    predecessorOffsets: [-1],
  },

  // Phase 4: Phát triển Backend (GROUP)
  {
    name: '4. Phát triển Backend',
    duration: 35,
    progress: 40,
    isGroup: true,
    predecessorOffsets: [-1],
  },
  {
    name: '4.1 Setup project & CI/CD',
    duration: 3,
    progress: 100,
    parentIndex: 16,
  },
  {
    name: '4.2 Dev - Module Auth',
    duration: 5,
    progress: 80,
    parentIndex: 16,
    predecessorOffsets: [-1],
  },
  {
    name: '4.3 Dev - Module User Management',
    duration: 6,
    progress: 60,
    parentIndex: 16,
    predecessorOffsets: [-1],
  },
  {
    name: '4.4 Dev - Module Core Business',
    duration: 10,
    progress: 40,
    parentIndex: 16,
    predecessorOffsets: [-1],
  },
  {
    name: '4.5 Dev - Module Reporting',
    duration: 6,
    progress: 20,
    parentIndex: 16,
    predecessorOffsets: [-1],
  },
  {
    name: '4.6 Dev - Integration APIs',
    duration: 5,
    progress: 10,
    parentIndex: 16,
    predecessorOffsets: [-1],
  },

  // Phase 5: Phát triển Frontend (GROUP)
  {
    name: '5. Phát triển Frontend',
    duration: 32,
    progress: 35,
    isGroup: true,
    predecessorOffsets: [-6],
  },
  { name: '5.1 Setup FE project', duration: 2, progress: 100, parentIndex: 23 },
  {
    name: '5.2 Dev - Layout & Navigation',
    duration: 4,
    progress: 90,
    parentIndex: 23,
    predecessorOffsets: [-1],
  },
  {
    name: '5.3 Dev - Auth screens',
    duration: 4,
    progress: 70,
    parentIndex: 23,
    predecessorOffsets: [-1],
  },
  {
    name: '5.4 Dev - Dashboard',
    duration: 5,
    progress: 50,
    parentIndex: 23,
    predecessorOffsets: [-1],
  },
  {
    name: '5.5 Dev - User Management UI',
    duration: 5,
    progress: 30,
    parentIndex: 23,
    predecessorOffsets: [-1],
  },
  {
    name: '5.6 Dev - Core Business UI',
    duration: 8,
    progress: 15,
    parentIndex: 23,
    predecessorOffsets: [-1],
  },
  {
    name: '5.7 Dev - Reports UI',
    duration: 5,
    progress: 0,
    parentIndex: 23,
    predecessorOffsets: [-1],
  },

  // Phase 6: Kiểm thử (GROUP)
  {
    name: '6. Kiểm thử (Testing)',
    duration: 30,
    progress: 15,
    isGroup: true,
    predecessorOffsets: [-1],
  },
  { name: '6.1 Lập test plan', duration: 3, progress: 50, parentIndex: 31 },
  {
    name: '6.2 Viết test cases',
    duration: 5,
    progress: 30,
    parentIndex: 31,
    predecessorOffsets: [-1],
  },
  {
    name: '6.3 Integration Testing',
    duration: 7,
    progress: 10,
    parentIndex: 31,
    predecessorOffsets: [-1],
  },
  {
    name: '6.4 System Testing',
    duration: 6,
    progress: 0,
    parentIndex: 31,
    predecessorOffsets: [-1],
  },
  {
    name: '6.5 Performance Testing',
    duration: 4,
    progress: 0,
    parentIndex: 31,
    predecessorOffsets: [-1],
  },
  {
    name: '6.6 Bug fixing & Regression',
    duration: 5,
    progress: 0,
    parentIndex: 31,
    predecessorOffsets: [-1],
  },

  // Phase 7: UAT & Triển khai (GROUP)
  {
    name: '7. UAT & Triển khai',
    duration: 25,
    progress: 0,
    isGroup: true,
    predecessorOffsets: [-1],
  },
  {
    name: '7.1 Chuẩn bị môi trường UAT',
    duration: 2,
    progress: 0,
    parentIndex: 38,
  },
  {
    name: '7.2 Training end-users',
    duration: 3,
    progress: 0,
    parentIndex: 38,
    predecessorOffsets: [-1],
  },
  {
    name: '7.3 UAT execution',
    duration: 7,
    progress: 0,
    parentIndex: 38,
    predecessorOffsets: [-1],
  },
  {
    name: '7.4 UAT bug fixes',
    duration: 4,
    progress: 0,
    parentIndex: 38,
    predecessorOffsets: [-1],
  },
  {
    name: '7.5 UAT sign-off',
    duration: 1,
    progress: 0,
    parentIndex: 38,
    predecessorOffsets: [-1],
  },
  {
    name: '7.6 Go-live deployment',
    duration: 2,
    progress: 0,
    parentIndex: 38,
    predecessorOffsets: [-1],
  },
  {
    name: '7.7 Hypercare support',
    duration: 10,
    progress: 0,
    parentIndex: 38,
    predecessorOffsets: [-1],
  },
];

const DEFAULT_TASK_BAR_LABELS: TaskBarLabels = {
  showName: true,
  showAssignees: false,
  showDuration: false,
  showDates: false,
};

export function GanttView({
  projectId,
  projectMembers,
  holidays,
  settings,
}: GanttViewProps) {
  const { data: tasks = [], isLoading } = useTasks(projectId);
  const { data: allEmployees = [] } = useEmployees();
  const { data: allocations = [] } = useAllocations(projectId);
  const { data: taskStatuses = [] } = useTaskStatuses(projectId);
  const { data: taskLabels = [] } = useTaskLabels(projectId);
  const { data: projectMilestones = [] } = useProjectMilestones(projectId);
  const { data: viewSettings } = useViewSettings();
  const saveViewSettings = useSaveViewSettings();
  const addTask = useAddTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const bulkUpdateTasks = useBulkUpdateTasks();
  const bulkSetAllocations = useBulkSetAllocations();
  const updateProject = useUpdateProject();
  const { user, profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ganttPanelsRef = useRef<GanttPanelsHandle>(null);

  const [viewMode, setViewMode] = useState<GanttViewMode>('day');
  const [startDate, setStartDate] = useState(() => subWeeks(new Date(), 1));
  const [endDate, setEndDate] = useState(() => addMonths(new Date(), 2));
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showBaselineDialog, setShowBaselineDialog] = useState(false);
  const [viewingBaseline, setViewingBaseline] = useState<{
    id: string;
    name: string;
    tasks: Task[];
  } | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
    new Set()
  );
  const [columns, setColumns] = useState<CustomColumn[]>(DEFAULT_COLUMNS);
  const [insertAfterTaskId, setInsertAfterTaskId] = useState<string | null>(
    null
  );
  const [customViewMode, setCustomViewMode] = useState(false);
  const [taskBarLabels, setTaskBarLabels] = useState<TaskBarLabels>(
    DEFAULT_TASK_BAR_LABELS
  );
  const [settingsInitialized, setSettingsInitialized] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRestoreBaselineConfirm, setShowRestoreBaselineConfirm] =
    useState(false);
  const [filterAssigneeIds, setFilterAssigneeIds] = useState<string[]>([]);
  const restoreBaseline = useRestoreBaseline();

  // Load settings from saved view settings
  useEffect(() => {
    if (viewSettings && !settingsInitialized) {
      if (viewSettings.taskBarLabels) {
        setTaskBarLabels(viewSettings.taskBarLabels);
      }
      if (viewSettings.expandedTaskIds?.[projectId]) {
        setExpandedTasks(new Set(viewSettings.expandedTaskIds[projectId]));
      }
      // Load column settings
      if (
        viewSettings.columnSettings &&
        viewSettings.columnSettings.length > 0
      ) {
        setColumns((prevCols) =>
          prevCols.map((col) => {
            const saved = viewSettings.columnSettings?.find(
              (s) => s.id === col.id
            );
            if (saved) {
              return { ...col, width: saved.width, visible: saved.visible };
            }
            return col;
          })
        );
      }
      setSettingsInitialized(true);
    }
  }, [viewSettings, settingsInitialized, projectId]);

  // Auto scroll to today when component mounts
  useEffect(() => {
    // Set start date to current month and scroll to today after mount
    setStartDate(startOfMonth(new Date()));
    const timer = setTimeout(() => {
      ganttPanelsRef.current?.scrollToToday();
    }, 300);
    return () => clearTimeout(timer);
  }, [projectId]); // Re-run when projectId changes (navigating between projects)

  // Save taskBarLabels when changed
  const handleTaskBarLabelsChange = useCallback(
    (newLabels: TaskBarLabels) => {
      setTaskBarLabels(newLabels);
      saveViewSettings.mutate({
        ...viewSettings,
        taskBarLabels: newLabels,
      });
    },
    [viewSettings, saveViewSettings]
  );

  // Save expandedTasks when changed
  const handleExpandedTasksChange = useCallback(
    (newExpandedTasks: Set<string>) => {
      setExpandedTasks(newExpandedTasks);
      saveViewSettings.mutate({
        ...viewSettings,
        expandedTaskIds: {
          ...viewSettings?.expandedTaskIds,
          [projectId]: Array.from(newExpandedTasks),
        },
      });
    },
    [viewSettings, saveViewSettings, projectId]
  );

  // Save columns when changed
  const handleColumnsChange = useCallback(
    (newColumns: CustomColumn[]) => {
      setColumns(newColumns);
      // Debounce saving to avoid too many requests during resize
      const columnSettings = newColumns.map((col) => ({
        id: col.id,
        width: col.width,
        visible: col.visible,
      }));
      saveViewSettings.mutate({
        ...viewSettings,
        columnSettings,
      });
    },
    [viewSettings, saveViewSettings]
  );
  // Use baseline tasks when viewing a baseline, otherwise use current tasks
  const displayTasks = viewingBaseline ? viewingBaseline.tasks : tasks;
  const isReadOnly = !!viewingBaseline;

  // Task ID mapping (1-based index) - use displayTasks for viewing
  const taskIdMap = useMemo(() => {
    const map = new Map<string, number>();
    displayTasks.forEach((task, idx) => {
      map.set(task.id, idx + 1);
    });
    return map;
  }, [displayTasks]);

  // Reverse map for looking up task by ID number
  const taskByIdNumber = useMemo(() => {
    const map = new Map<number, Task>();
    displayTasks.forEach((task, idx) => {
      map.set(idx + 1, task);
    });
    return map;
  }, [displayTasks]);

  // WBS mapping (hierarchical numbering: 1, 1.1, 1.1.1, etc.)
  const wbsMap = useMemo(() => {
    const map = new Map<string, string>();

    // Build task tree for WBS calculation
    const taskMap = new Map<string, Task>();
    const rootTasks: Task[] = [];

    displayTasks.forEach((task) => {
      taskMap.set(task.id, { ...task, children: [] });
    });

    displayTasks.forEach((task) => {
      const currentTask = taskMap.get(task.id)!;
      if (task.parent_id && taskMap.has(task.parent_id)) {
        const parent = taskMap.get(task.parent_id)!;
        parent.children = parent.children || [];
        parent.children.push(currentTask);
      } else {
        rootTasks.push(currentTask);
      }
    });

    // Sort by sort_order
    const sortTasks = (taskList: Task[]) => {
      taskList.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      taskList.forEach((task) => {
        if (task.children?.length) sortTasks(task.children);
      });
    };
    sortTasks(rootTasks);

    // Assign WBS numbers
    const assignWbs = (taskList: Task[], prefix: string) => {
      taskList.forEach((task, index) => {
        const wbs = prefix ? `${prefix}.${index + 1}` : `${index + 1}`;
        map.set(task.id, wbs);
        if (task.children?.length) {
          assignWbs(task.children, wbs);
        }
      });
    };
    assignWbs(rootTasks, '');

    return map;
  }, [displayTasks]);

  // Helper to check if date is a holiday
  const isHoliday = useCallback(
    (date: Date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const monthDay = format(date, 'MM-dd');
      return holidays.some((h) => {
        if (h.is_recurring) {
          const startMonthDay = h.date.slice(5);
          const endMonthDay = h.end_date ? h.end_date.slice(5) : startMonthDay;
          return monthDay >= startMonthDay && monthDay <= endMonthDay;
        }
        const endDate = h.end_date || h.date;
        return dateStr >= h.date && dateStr <= endDate;
      });
    },
    [holidays]
  );

  // Helper to check if Saturday is a working day
  const checkSaturdayWorkingDay = useCallback(
    (date: Date) => {
      // Support new saturday_schedule format
      if (settings?.saturday_schedule) {
        const schedule = settings.saturday_schedule;
        if (!schedule.enabled) return false;
        if (!schedule.alternating) return true; // All Saturdays are working days

        // Use reference date for alternating calculation
        let referenceDate: Date;
        if (schedule.referenceStartDate) {
          referenceDate = new Date(schedule.referenceStartDate);
        } else {
          referenceDate = new Date(2024, 0, 1);
        }

        const diffTime = date.getTime() - referenceDate.getTime();
        const diffWeeks = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000));
        const isEvenWeek = diffWeeks % 2 === 0;

        if (schedule.referenceStartDate) {
          return isEvenWeek;
        }
        return schedule.startWeekWithSaturday ? isEvenWeek : !isEvenWeek;
      }

      // Legacy support for old saturday_work_mode
      if (!settings?.saturday_work_mode) return false;
      const mode = settings.saturday_work_mode;
      if (mode === 'all') return true;
      if (mode === 'none') return false;
      if (mode === 'odd' || mode === 'even') {
        const weekOfMonth = Math.ceil(date.getDate() / 7);
        return mode === 'odd' ? weekOfMonth % 2 === 1 : weekOfMonth % 2 === 0;
      }
      return false;
    },
    [settings]
  );

  const isNonWorkingDay = useCallback(
    (date: Date) => {
      if (isHoliday(date)) return true;
      if (isSunday(date)) return true;
      if (isSaturday(date)) return !checkSaturdayWorkingDay(date);
      return false;
    },
    [isHoliday, checkSaturdayWorkingDay]
  );

  // Count working days between two dates
  const countWorkingDays = useCallback(
    (start: Date, end: Date) => {
      if (start > end) return 0;
      let count = 0;
      let current = new Date(start);
      while (current <= end) {
        if (!isNonWorkingDay(current)) {
          count++;
        }
        current = addDays(current, 1);
      }
      return count;
    },
    [isNonWorkingDay]
  );

  // Add working days to a date
  const addWorkingDays = useCallback(
    (date: Date, days: number) => {
      let current = new Date(date);
      let remaining = days - 1; // duration includes start date

      while (remaining > 0) {
        current = addDays(current, 1);
        if (!isNonWorkingDay(current)) {
          remaining--;
        }
      }
      return current;
    },
    [isNonWorkingDay]
  );

  // Get next working day after a date
  const getNextWorkingDay = useCallback(
    (date: Date) => {
      let current = addDays(date, 1);
      while (isNonWorkingDay(current)) {
        current = addDays(current, 1);
      }
      return current;
    },
    [isNonWorkingDay]
  );

  // Build hierarchical task tree - use displayTasks for viewing
  const taskTree = useMemo(() => {
    const taskMap = new Map<string, Task>();
    const rootTasks: Task[] = [];

    // First pass: create task map
    displayTasks.forEach((task) => {
      taskMap.set(task.id, { ...task, children: [], level: 0 });
    });

    // Second pass: build hierarchy
    displayTasks.forEach((task) => {
      const currentTask = taskMap.get(task.id)!;
      if (task.parent_id && taskMap.has(task.parent_id)) {
        const parent = taskMap.get(task.parent_id)!;
        parent.children = parent.children || [];
        parent.children.push(currentTask);
        currentTask.level = (parent.level || 0) + 1;
      } else {
        rootTasks.push(currentTask);
      }
    });

    // Sort children by sort_order
    const sortChildren = (taskList: Task[]) => {
      taskList.sort((a, b) => a.sort_order - b.sort_order);
      taskList.forEach((task) => {
        if (task.children && task.children.length > 0) {
          sortChildren(task.children);
        }
      });
    };
    sortChildren(rootTasks);

    return rootTasks;
  }, [displayTasks]);

  // Get all tasks with level info (for filtering purposes - ignores expansion state)
  const allFlatTasksWithLevel = useMemo(() => {
    const result: Task[] = [];
    const flatten = (taskList: Task[], level: number) => {
      taskList.forEach((task) => {
        result.push({ ...task, level, isExpanded: expandedTasks.has(task.id) });
        if (task.children && task.children.length > 0) {
          flatten(task.children, level + 1);
        }
      });
    };
    flatten(taskTree, 0);
    return result;
  }, [taskTree, expandedTasks]);

  // Flatten task tree for display (respects expansion state when NOT filtering)
  const flatTasks = useMemo(() => {
    const result: Task[] = [];
    const flatten = (taskList: Task[], level: number) => {
      taskList.forEach((task) => {
        result.push({ ...task, level, isExpanded: expandedTasks.has(task.id) });
        if (
          task.children &&
          task.children.length > 0 &&
          expandedTasks.has(task.id)
        ) {
          flatten(task.children, level + 1);
        }
      });
    };
    flatten(taskTree, 0);
    return result;
  }, [taskTree, expandedTasks]);

  // Filter flat tasks by assignees if filter is active
  const filteredFlatTasks = useMemo(() => {
    if (filterAssigneeIds.length === 0) {
      return flatTasks;
    }

    // When filtering, use ALL tasks (ignore expansion state) to find matches
    // This ensures filtering works consistently across all users
    const matchingTaskIds = new Set<string>();
    const parentTaskIds = new Set<string>();

    // First pass: find all tasks that have any of the selected assignees
    allFlatTasksWithLevel.forEach((task) => {
      const taskAssignees = task.assignees || [];
      const hasMatchingAssignee = filterAssigneeIds.some((id) =>
        taskAssignees.includes(id)
      );
      if (hasMatchingAssignee) {
        matchingTaskIds.add(task.id);
        // Also include all parent tasks
        let parentId = task.parent_id;
        while (parentId) {
          parentTaskIds.add(parentId);
          const parent = allFlatTasksWithLevel.find((t) => t.id === parentId);
          parentId = parent?.parent_id || null;
        }
      }
    });

    // Return tasks from allFlatTasksWithLevel that either match the filter or are parents of matching tasks
    return allFlatTasksWithLevel.filter(
      (task) => matchingTaskIds.has(task.id) || parentTaskIds.has(task.id)
    );
  }, [flatTasks, allFlatTasksWithLevel, filterAssigneeIds]);

  // Calculate min/max dates from tasks for auto-extending timeline
  const taskDateRange = useMemo(() => {
    let minDate: Date | null = null;
    let maxDate: Date | null = null;

    displayTasks.forEach((task) => {
      if (task.start_date) {
        const start = parseISO(task.start_date);
        if (!minDate || start < minDate) minDate = start;
      }
      if (task.end_date) {
        const end = parseISO(task.end_date);
        if (!maxDate || end > maxDate) maxDate = end;
      }
    });

    return { minDate, maxDate };
  }, [displayTasks]);

  // Generate timeline columns
  const timelineColumns = useMemo(() => {
    // Calculate timeline end based on view mode and task dates
    let timelineEnd: Date;
    const defaultEnd = addMonths(
      startDate,
      viewMode === 'day' ? 2 : viewMode === 'week' ? 4 : 12
    );

    if (customViewMode) {
      timelineEnd = endDate;
    } else if (taskDateRange.maxDate && taskDateRange.maxDate > defaultEnd) {
      // Extend timeline to include all tasks + 1 week buffer
      timelineEnd = addDays(taskDateRange.maxDate, 7);
    } else {
      timelineEnd = defaultEnd;
    }

    const days = eachDayOfInterval({ start: startDate, end: timelineEnd });

    if (viewMode === 'day') {
      return days.map((d) => ({
        date: d,
        label: format(d, 'dd/MM'),
        subLabel: format(d, 'EEE', { locale: vi }),
        width: 32,
        days: 1,
      }));
    } else if (viewMode === 'week') {
      // Group by weeks (1 week = 1 compact column)
      const WEEK_COL_WIDTH = 84; // compact width for week view

      const weeks: {
        date: Date;
        label: string;
        subLabel: string;
        width: number;
        days: number;
      }[] = [];
      let currentWeek = days[0];
      let weekDays = 0;

      days.forEach((day, idx) => {
        weekDays++;
        if (day.getDay() === 0 || idx === days.length - 1) {
          weeks.push({
            date: currentWeek,
            label: `T${format(currentWeek, 'w')}`,
            subLabel: format(currentWeek, 'dd/MM'),
            width: WEEK_COL_WIDTH,
            days: weekDays,
          });
          currentWeek = addDays(day, 1);
          weekDays = 0;
        }
      });
      return weeks;
    } else {
      // Group by months (1 month = 1 compact column)
      const MONTH_COL_WIDTH = 100; // compact width for month view

      const months: {
        date: Date;
        label: string;
        subLabel: string;
        width: number;
        days: number;
      }[] = [];
      let currentMonth = startOfMonth(days[0]);
      let monthDays = 0;

      days.forEach((day, idx) => {
        monthDays++;
        if (
          idx === days.length - 1 ||
          startOfMonth(addDays(day, 1)).getTime() !== currentMonth.getTime()
        ) {
          months.push({
            date: currentMonth,
            label: format(currentMonth, 'MMM', { locale: vi }),
            subLabel: format(currentMonth, 'yyyy'),
            width: MONTH_COL_WIDTH,
            days: monthDays,
          });
          currentMonth = startOfMonth(addDays(day, 1));
          monthDays = 0;
        }
      });
      return months;
    }
  }, [startDate, endDate, customViewMode, viewMode, taskDateRange]);

  const toggleTaskExpansion = useCallback(
    (taskId: string) => {
      const next = new Set(expandedTasks);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      handleExpandedTasksChange(next);
    },
    [expandedTasks, handleExpandedTasksChange]
  );

  const handleAddTask = useCallback(
    async (parentId?: string | null, afterTaskId?: string | null) => {
      // Create task directly without opening dialog
      const newTaskName = 'New Task';

      if (afterTaskId) {
        // Insert after a specific task
        const afterTask = tasks.find((t) => t.id === afterTaskId);
        if (!afterTask) return;

        // Find siblings at the same level
        const siblings = tasks.filter(
          (t) => t.parent_id === afterTask.parent_id
        );
        siblings.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

        const afterIndex = siblings.findIndex((t) => t.id === afterTaskId);
        const afterOrder = afterTask.sort_order || 0;
        const nextSibling = siblings[afterIndex + 1];
        const nextOrder = nextSibling
          ? nextSibling.sort_order || 0
          : afterOrder + 1000;
        const newSortOrder = Math.floor((afterOrder + nextOrder) / 2);

        // Check if we need to rebalance
        if (newSortOrder === afterOrder || newSortOrder === nextOrder) {
          // Rebalance all siblings
          const updates = siblings.map((t, idx) => ({
            id: t.id,
            data: { sort_order: (idx + 1) * 1000 },
          }));
          await bulkUpdateTasks.mutateAsync({ projectId, updates });

          // Add new task with correct order
          const result = await addTask.mutateAsync({
            name: newTaskName,
            project_id: projectId,
            parent_id: afterTask.parent_id || null,
            sort_order: (afterIndex + 1) * 1000 + 500,
          });
          if (result?.id) {
            setSelectedTaskIds(new Set([result.id]));
          }
        } else {
          const result = await addTask.mutateAsync({
            name: newTaskName,
            project_id: projectId,
            parent_id: afterTask.parent_id || null,
            sort_order: newSortOrder,
          });
          if (result?.id) {
            setSelectedTaskIds(new Set([result.id]));
          }
        }
      } else if (parentId) {
        // Add as child of parent task
        const childTasks = tasks.filter((t) => t.parent_id === parentId);
        const maxOrder = childTasks.reduce(
          (max, t) => Math.max(max, t.sort_order || 0),
          0
        );

        const result = await addTask.mutateAsync({
          name: newTaskName,
          project_id: projectId,
          parent_id: parentId,
          sort_order: maxOrder + 1000,
        });

        if (result?.id) {
          // Expand parent to show new child
          if (!expandedTasks.has(parentId)) {
            const next = new Set(expandedTasks);
            next.add(parentId);
            handleExpandedTasksChange(next);
          }
          setSelectedTaskIds(new Set([result.id]));
        }
      } else {
        // Add at root level (fallback - should not happen from popup)
        const rootTasks = tasks.filter((t) => !t.parent_id);
        const maxOrder = rootTasks.reduce(
          (max, t) => Math.max(max, t.sort_order || 0),
          0
        );

        const result = await addTask.mutateAsync({
          name: newTaskName,
          project_id: projectId,
          parent_id: null,
          sort_order: maxOrder + 1000,
        });
        if (result?.id) {
          setSelectedTaskIds(new Set([result.id]));
        }
      }
    },
    [
      tasks,
      projectId,
      addTask,
      bulkUpdateTasks,
      expandedTasks,
      handleExpandedTasksChange,
    ]
  );

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setShowAddDialog(true);
  }, []);

  const handleDeleteTask = useCallback(
    async (taskId: string) => {
      await deleteTask.mutateAsync({ id: taskId, projectId });
    },
    [deleteTask, projectId]
  );

  // Helper to get all descendant task IDs recursively
  const getDescendantIds = useCallback(
    (parentId: string): string[] => {
      const children = tasks.filter((t) => t.parent_id === parentId);
      const descendants: string[] = [];
      children.forEach((child) => {
        descendants.push(child.id);
        descendants.push(...getDescendantIds(child.id));
      });
      return descendants;
    },
    [tasks]
  );

  // Update child tasks when parent dates change - collect all updates first
  const collectChildUpdates = useCallback(
    (
      parentId: string,
      dateDelta: number,
      tasksList: Task[]
    ): { id: string; data: Partial<Task> }[] => {
      const childTasks = tasksList.filter((t) => t.parent_id === parentId);
      const updates: { id: string; data: Partial<Task> }[] = [];

      for (const child of childTasks) {
        if (!child.start_date || !child.end_date) continue;

        // Shift child dates by the same delta
        const childStartDate = parseISO(child.start_date);
        const childEndDate = parseISO(child.end_date);

        const newChildStart = addDays(childStartDate, dateDelta);
        const newChildEnd = addDays(childEndDate, dateDelta);

        updates.push({
          id: child.id,
          data: {
            start_date: format(newChildStart, 'yyyy-MM-dd'),
            end_date: format(newChildEnd, 'yyyy-MM-dd'),
          },
        });

        // Recursively collect grandchildren updates
        updates.push(...collectChildUpdates(child.id, dateDelta, tasksList));
      }

      return updates;
    },
    []
  );

  // Update child tasks when parent dates change
  const updateChildTasks = useCallback(
    async (parentId: string, dateDelta: number) => {
      const allUpdates = collectChildUpdates(parentId, dateDelta, tasks);

      if (allUpdates.length === 0) return;

      // Update all children in sequence
      for (const update of allUpdates) {
        await updateTask.mutateAsync({
          id: update.id,
          projectId,
          data: update.data,
        });
      }
    },
    [tasks, updateTask, projectId, collectChildUpdates]
  );

  // Update parent task's date range when child dates exceed parent range
  const updateParentTaskDates = useCallback(
    async (childTask: Task) => {
      if (!childTask.parent_id || !childTask.start_date || !childTask.end_date)
        return;

      const parentTask = tasks.find((t) => t.id === childTask.parent_id);
      if (!parentTask) return;

      let needsUpdate = false;
      const updateData: Partial<Task> = {};

      // Check if child start_date is before parent start_date
      if (parentTask.start_date) {
        const childStart = parseISO(childTask.start_date);
        const parentStart = parseISO(parentTask.start_date);
        if (childStart < parentStart) {
          updateData.start_date = childTask.start_date;
          needsUpdate = true;
        }
      } else {
        updateData.start_date = childTask.start_date;
        needsUpdate = true;
      }

      // Check if child end_date is after parent end_date
      if (parentTask.end_date) {
        const childEnd = parseISO(childTask.end_date);
        const parentEnd = parseISO(parentTask.end_date);
        if (childEnd > parentEnd) {
          updateData.end_date = childTask.end_date;
          needsUpdate = true;
        }
      } else {
        updateData.end_date = childTask.end_date;
        needsUpdate = true;
      }

      // Recalculate duration if dates changed
      if (needsUpdate) {
        const newStart = updateData.start_date
          ? parseISO(updateData.start_date)
          : parseISO(parentTask.start_date!);
        const newEnd = updateData.end_date
          ? parseISO(updateData.end_date)
          : parseISO(parentTask.end_date!);
        updateData.duration = countWorkingDays(newStart, newEnd);

        await updateTask.mutateAsync({
          id: parentTask.id,
          projectId,
          data: updateData,
        });

        // Recursively update grandparent if needed
        await updateParentTaskDates({ ...parentTask, ...updateData } as Task);
      }
    },
    [tasks, updateTask, projectId, countWorkingDays]
  );

  // Update dependent tasks when a task's end_date changes (tasks that have this task as predecessor)
  const updateDependentTasks = useCallback(
    async (changedTaskId: string, newEndDate: string) => {
      // Find all tasks that have changedTaskId as a predecessor
      const dependentTasks = tasks.filter((t) =>
        t.predecessors?.includes(changedTaskId)
      );

      if (dependentTasks.length === 0) return;

      const newEndDateObj = parseISO(newEndDate);

      for (const depTask of dependentTasks) {
        // Find the latest end_date among ALL predecessors of this dependent task
        let latestPredEndDate = newEndDateObj;

        if (depTask.predecessors && depTask.predecessors.length > 0) {
          for (const predId of depTask.predecessors) {
            if (predId === changedTaskId) {
              // Use the new end date for the changed task
              if (newEndDateObj > latestPredEndDate) {
                latestPredEndDate = newEndDateObj;
              }
            } else {
              const predTask = tasks.find((t) => t.id === predId);
              if (predTask?.end_date) {
                const predEndDate = parseISO(predTask.end_date);
                if (predEndDate > latestPredEndDate) {
                  latestPredEndDate = predEndDate;
                }
              }
            }
          }
        }

        // Calculate new start_date (next working day after latest predecessor)
        const newStartDate = getNextWorkingDay(latestPredEndDate);
        const newStartDateStr = format(newStartDate, 'yyyy-MM-dd');

        // Calculate new end_date based on duration
        const duration = depTask.duration || 1;
        const newDepEndDate = addWorkingDays(newStartDate, duration);
        const newDepEndDateStr = format(newDepEndDate, 'yyyy-MM-dd');

        // Only update if dates actually changed
        if (
          depTask.start_date !== newStartDateStr ||
          depTask.end_date !== newDepEndDateStr
        ) {
          await updateTask.mutateAsync({
            id: depTask.id,
            projectId,
            data: {
              start_date: newStartDateStr,
              end_date: newDepEndDateStr,
            },
          });

          // Also update children of this dependent task
          if (depTask.start_date) {
            const dateDelta = differenceInDays(
              newStartDate,
              parseISO(depTask.start_date)
            );
            if (dateDelta !== 0) {
              await updateChildTasks(depTask.id, dateDelta);
            }
          }

          // Recursively update tasks that depend on this task
          await updateDependentTasks(depTask.id, newDepEndDateStr);
        }
      }
    },
    [
      tasks,
      updateTask,
      projectId,
      getNextWorkingDay,
      addWorkingDays,
      updateChildTasks,
    ]
  );

  // Handle save task from dialog - MUST be after updateChildTasks
  const handleSaveTask = useCallback(
    async (taskData: Partial<Task>) => {
      if (editingTask?.id) {
        // Check if start_date changed to update children
        let dateDelta = 0;
        const oldStartDate = editingTask.start_date;
        const newStartDate = taskData.start_date;

        if (oldStartDate && newStartDate && oldStartDate !== newStartDate) {
          dateDelta = differenceInDays(
            parseISO(newStartDate),
            parseISO(oldStartDate)
          );
        }

        await updateTask.mutateAsync({
          id: editingTask.id,
          projectId,
          data: taskData,
        });

        // Update child tasks if start_date changed
        if (dateDelta !== 0) {
          await updateChildTasks(editingTask.id, dateDelta);
        }

        // Update parent task if child dates exceed parent range
        const updatedTask = { ...editingTask, ...taskData } as Task;
        if (updatedTask.parent_id && taskData.start_date && taskData.end_date) {
          await updateParentTaskDates(updatedTask);
        }
      } else {
        // Calculate sort_order
        let sortOrder = 0;
        const batchUpdates: { id: string; data: Partial<Task> }[] = [];

        if (insertAfterTaskId) {
          const afterTask = tasks.find((t) => t.id === insertAfterTaskId);
          if (afterTask) {
            sortOrder = afterTask.sort_order + 1;
            // Collect batch updates for sort_order
            const tasksToUpdate = tasks.filter(
              (t) =>
                t.sort_order > afterTask.sort_order &&
                t.parent_id === afterTask.parent_id
            );
            tasksToUpdate.forEach((t) => {
              batchUpdates.push({
                id: t.id,
                data: { sort_order: t.sort_order + 1 },
              });
            });
          }
        } else {
          const parentId = taskData.parent_id || null;
          const siblingTasks = tasks.filter((t) => t.parent_id === parentId);
          sortOrder =
            siblingTasks.length > 0
              ? Math.max(...siblingTasks.map((t) => t.sort_order)) + 1
              : 0;
        }

        // Execute batch update in parallel, then add task
        if (batchUpdates.length > 0) {
          await bulkUpdateTasks.mutateAsync({
            projectId,
            updates: batchUpdates,
          });
        }

        const newTask = await addTask.mutateAsync({
          ...taskData,
          project_id: projectId,
          sort_order: sortOrder,
        } as any);

        // Update parent task if new task dates exceed parent range
        if (taskData.parent_id && taskData.start_date && taskData.end_date) {
          await updateParentTaskDates({ ...taskData, id: newTask?.id } as Task);
        }
      }
      setShowAddDialog(false);
      setEditingTask(null);
      setInsertAfterTaskId(null);
    },
    [
      editingTask,
      insertAfterTaskId,
      tasks,
      updateTask,
      addTask,
      bulkUpdateTasks,
      projectId,
      updateChildTasks,
      updateParentTaskDates,
    ]
  );

  const handleUpdateTaskField = useCallback(
    async (taskId: string, field: string, value: any) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      const updateData: Partial<Task> = { [field]: value };
      let dateDelta = 0;
      const oldStartDate = task.start_date;
      const oldEndDate = task.end_date;
      let newEndDateForDependents: string | null = null;

      // Auto-calculate end_date if start_date or duration changes (using working days)
      if (field === 'start_date' && value && task.duration) {
        const startDateObj = parseISO(value);
        const endDateObj = addWorkingDays(startDateObj, task.duration);
        updateData.end_date = format(endDateObj, 'yyyy-MM-dd');
        newEndDateForDependents = updateData.end_date;

        // Calculate delta for child updates
        if (oldStartDate) {
          dateDelta = differenceInDays(startDateObj, parseISO(oldStartDate));
        }
      } else if (field === 'duration' && task.start_date) {
        const startDateObj = parseISO(task.start_date);
        const endDateObj = addWorkingDays(startDateObj, value);
        updateData.end_date = format(endDateObj, 'yyyy-MM-dd');
        newEndDateForDependents = updateData.end_date;
      } else if (field === 'end_date' && value && task.start_date) {
        // Recalculate duration based on working days
        const startDateObj = parseISO(task.start_date);
        const endDateObj = parseISO(value);
        updateData.duration = countWorkingDays(startDateObj, endDateObj);
        newEndDateForDependents = value;
      }

      // Auto-update start_date based on predecessors
      if (
        field === 'predecessors' &&
        Array.isArray(value) &&
        value.length > 0
      ) {
        // Find the latest end_date among predecessors
        let latestEndDate: Date | null = null;
        value.forEach((predId) => {
          const predTask = tasks.find((t) => t.id === predId);
          if (predTask?.end_date) {
            const predEndDate = parseISO(predTask.end_date);
            if (!latestEndDate || predEndDate > latestEndDate) {
              latestEndDate = predEndDate;
            }
          }
        });

        if (latestEndDate) {
          // Set start_date to next working day after predecessor's end_date
          const newStartDate = getNextWorkingDay(latestEndDate);
          updateData.start_date = format(newStartDate, 'yyyy-MM-dd');

          // Also update end_date based on duration
          if (task.duration) {
            const newEndDate = addWorkingDays(newStartDate, task.duration);
            updateData.end_date = format(newEndDate, 'yyyy-MM-dd');
            newEndDateForDependents = updateData.end_date;
          }

          // Calculate delta for child updates
          if (oldStartDate) {
            dateDelta = differenceInDays(newStartDate, parseISO(oldStartDate));
          }
        }
      }

      await updateTask.mutateAsync({ id: taskId, projectId, data: updateData });

      // Update child tasks if start_date changed
      if (dateDelta !== 0) {
        await updateChildTasks(taskId, dateDelta);
      }

      // Update dependent tasks (tasks that have this task as predecessor) if end_date changed
      if (newEndDateForDependents && newEndDateForDependents !== oldEndDate) {
        await updateDependentTasks(taskId, newEndDateForDependents);
      }

      // Update parent task if child dates exceed parent range
      const updatedTask = { ...task, ...updateData } as Task;
      if (
        updatedTask.parent_id &&
        (field === 'start_date' || field === 'end_date' || field === 'duration')
      ) {
        await updateParentTaskDates(updatedTask);
      }
    },
    [
      tasks,
      updateTask,
      projectId,
      addWorkingDays,
      countWorkingDays,
      getNextWorkingDay,
      updateChildTasks,
      updateDependentTasks,
      updateParentTaskDates,
    ]
  );

  // Get first selected task ID for single-task operations
  const selectedTaskId = useMemo(() => {
    if (selectedTaskIds.size === 0) return null;
    return Array.from(selectedTaskIds)[0];
  }, [selectedTaskIds]);

  // Handle task selection with Ctrl support
  const handleSelectTask = useCallback(
    (taskId: string | null, ctrlKey?: boolean) => {
      if (!taskId) {
        setSelectedTaskIds(new Set());
        return;
      }

      if (ctrlKey) {
        // Multi-select with Ctrl
        setSelectedTaskIds((prev) => {
          const next = new Set(prev);
          if (next.has(taskId)) {
            next.delete(taskId);
          } else {
            next.add(taskId);
          }
          return next;
        });
      } else {
        // Single select
        setSelectedTaskIds(new Set([taskId]));
      }
    },
    []
  );

  // Check if all selected tasks are at the same level (same parent)
  const areSelectedTasksSameLevel = useMemo(() => {
    if (selectedTaskIds.size <= 1) return true;
    const selectedTasks = tasks.filter((t) => selectedTaskIds.has(t.id));
    if (selectedTasks.length === 0) return false;
    const firstParentId = selectedTasks[0].parent_id;
    return selectedTasks.every((t) => t.parent_id === firstParentId);
  }, [selectedTaskIds, tasks]);

  // Indent task(s) (make them children of the previous sibling)
  const handleIndent = useCallback(async () => {
    if (selectedTaskIds.size === 0) return;

    // Get selected tasks sorted by sort_order
    const selectedTasks = tasks
      .filter((t) => selectedTaskIds.has(t.id))
      .sort((a, b) => a.sort_order - b.sort_order);

    if (selectedTasks.length === 0) return;

    // Check if all selected tasks have the same parent
    const firstParentId = selectedTasks[0].parent_id;
    if (!selectedTasks.every((t) => t.parent_id === firstParentId)) {
      toast.error('Chỉ có thể indent các task cùng cấp');
      return;
    }

    // Find siblings (tasks with same parent)
    const siblings = tasks
      .filter((t) => t.parent_id === firstParentId)
      .sort((a, b) => a.sort_order - b.sort_order);

    // Find the first selected task's index
    const firstSelectedIndex = siblings.findIndex(
      (t) => t.id === selectedTasks[0].id
    );
    if (firstSelectedIndex <= 0) {
      toast.error('Không thể indent task đầu tiên');
      return;
    }

    // The new parent is the sibling just before the first selected task
    const newParent = siblings[firstSelectedIndex - 1];

    // Check that new parent is not one of the selected tasks
    if (selectedTaskIds.has(newParent.id)) {
      toast.error('Không thể indent - task phía trên cũng đang được chọn');
      return;
    }

    const existingChildren = tasks.filter((t) => t.parent_id === newParent.id);
    let newSortOrder =
      existingChildren.length > 0
        ? Math.max(...existingChildren.map((t) => t.sort_order)) + 1
        : 0;

    // Prepare updates for all selected tasks
    const updates: { id: string; data: Partial<Task> }[] = [];
    selectedTasks.forEach((task) => {
      updates.push({
        id: task.id,
        data: {
          parent_id: newParent.id,
          sort_order: newSortOrder++,
        },
      });
    });

    await bulkUpdateTasks.mutateAsync({ projectId, updates });

    // Expand parent to show the moved tasks
    handleExpandedTasksChange(new Set([...expandedTasks, newParent.id]));
    toast.success(`Đã indent ${selectedTasks.length} task`);
  }, [
    selectedTaskIds,
    tasks,
    bulkUpdateTasks,
    projectId,
    expandedTasks,
    handleExpandedTasksChange,
  ]);

  // Outdent task(s) (move to parent's level)
  const handleOutdent = useCallback(async () => {
    if (selectedTaskIds.size === 0) return;

    // Get selected tasks sorted by sort_order
    const selectedTasks = tasks
      .filter((t) => selectedTaskIds.has(t.id))
      .sort((a, b) => a.sort_order - b.sort_order);

    if (selectedTasks.length === 0) return;

    // Check if all selected tasks have the same parent
    const firstParentId = selectedTasks[0].parent_id;
    if (!firstParentId) {
      toast.error('Task đã ở mức cao nhất');
      return;
    }

    if (!selectedTasks.every((t) => t.parent_id === firstParentId)) {
      toast.error('Chỉ có thể outdent các task cùng cấp');
      return;
    }

    const parent = tasks.find((t) => t.id === firstParentId);
    if (!parent) return;

    // Find new siblings (tasks with same parent as parent)
    const newSiblings = tasks.filter((t) => t.parent_id === parent.parent_id);
    const parentSortOrder = parent.sort_order;

    // Collect all updates
    const updates: { id: string; data: Partial<Task> }[] = [];

    // Update sort_order for tasks after the parent first
    const tasksToShift = newSiblings.filter(
      (t) => t.sort_order > parentSortOrder
    );
    tasksToShift.forEach((t) => {
      updates.push({
        id: t.id,
        data: { sort_order: t.sort_order + selectedTasks.length },
      });
    });

    // Now add the selected tasks after parent
    selectedTasks.forEach((task, idx) => {
      updates.push({
        id: task.id,
        data: {
          parent_id: parent.parent_id || null,
          sort_order: parentSortOrder + 1 + idx,
        },
      });
    });

    await bulkUpdateTasks.mutateAsync({ projectId, updates });
    toast.success(`Đã outdent ${selectedTasks.length} task`);
  }, [selectedTaskIds, tasks, bulkUpdateTasks, projectId]);

  // Move task up
  const handleMoveUp = useCallback(async () => {
    if (!selectedTaskId) return;

    const selectedTask = tasks.find((t) => t.id === selectedTaskId);
    if (!selectedTask) return;

    const siblings = tasks
      .filter((t) => t.parent_id === selectedTask.parent_id)
      .sort((a, b) => a.sort_order - b.sort_order);

    const currentIndex = siblings.findIndex((t) => t.id === selectedTaskId);
    if (currentIndex <= 0) {
      toast.error('Task đã ở vị trí đầu tiên');
      return;
    }

    const prevTask = siblings[currentIndex - 1];

    // Swap sort_order using batch update
    await bulkUpdateTasks.mutateAsync({
      projectId,
      updates: [
        { id: selectedTaskId, data: { sort_order: prevTask.sort_order } },
        { id: prevTask.id, data: { sort_order: selectedTask.sort_order } },
      ],
    });

    toast.success('Đã di chuyển task lên');
  }, [selectedTaskId, tasks, bulkUpdateTasks, projectId]);

  // Move task down
  const handleMoveDown = useCallback(async () => {
    if (!selectedTaskId) return;

    const selectedTask = tasks.find((t) => t.id === selectedTaskId);
    if (!selectedTask) return;

    const siblings = tasks
      .filter((t) => t.parent_id === selectedTask.parent_id)
      .sort((a, b) => a.sort_order - b.sort_order);

    const currentIndex = siblings.findIndex((t) => t.id === selectedTaskId);
    if (currentIndex >= siblings.length - 1) {
      toast.error('Task đã ở vị trí cuối cùng');
      return;
    }

    const nextTask = siblings[currentIndex + 1];

    // Swap sort_order using batch update
    await bulkUpdateTasks.mutateAsync({
      projectId,
      updates: [
        { id: selectedTaskId, data: { sort_order: nextTask.sort_order } },
        { id: nextTask.id, data: { sort_order: selectedTask.sort_order } },
      ],
    });

    toast.success('Đã di chuyển task xuống');
  }, [selectedTaskId, tasks, bulkUpdateTasks, projectId]);

  // Context menu handlers (accept taskId as parameter)
  const handleContextInsertAbove = useCallback(
    async (taskId: string) => {
      const targetTask = tasks.find((t) => t.id === taskId);
      if (!targetTask) return;

      const siblings = tasks
        .filter((t) => t.parent_id === targetTask.parent_id)
        .sort((a, b) => a.sort_order - b.sort_order);

      const targetIndex = siblings.findIndex((t) => t.id === taskId);
      let newSortOrder: number;

      if (targetIndex === 0) {
        newSortOrder = targetTask.sort_order;
      } else {
        const prevTask = siblings[targetIndex - 1];
        newSortOrder = prevTask.sort_order + 1;
      }

      // Shift sort_order of target task and all tasks after it
      const batchUpdates: { id: string; data: Partial<Task> }[] = [];
      siblings.forEach((t, idx) => {
        if (idx >= targetIndex) {
          batchUpdates.push({
            id: t.id,
            data: { sort_order: t.sort_order + 1 },
          });
        }
      });

      if (batchUpdates.length > 0) {
        await bulkUpdateTasks.mutateAsync({ projectId, updates: batchUpdates });
      }

      const result = await addTask.mutateAsync({
        project_id: projectId,
        name: 'New Task',
        parent_id: targetTask.parent_id,
        sort_order: newSortOrder,
        duration: 1,
        progress: 0,
      } as any);

      setSelectedTaskIds(new Set([result.id]));
    },
    [tasks, addTask, bulkUpdateTasks, projectId]
  );

  const handleContextCopyTask = useCallback(
    async (taskId: string) => {
      const targetTask = tasks.find((t) => t.id === taskId);
      if (!targetTask) return;

      // Helper to get all descendants recursively
      const getAllDescendants = (parentId: string): Task[] => {
        const children = tasks.filter((t) => t.parent_id === parentId);
        const descendants: Task[] = [...children];
        children.forEach((child) => {
          descendants.push(...getAllDescendants(child.id));
        });
        return descendants;
      };

      const siblings = tasks
        .filter((t) => t.parent_id === targetTask.parent_id)
        .sort((a, b) => a.sort_order - b.sort_order);

      const targetIndex = siblings.findIndex((t) => t.id === taskId);
      const descendants = getAllDescendants(taskId);
      const totalTasksToCopy = 1 + descendants.length;

      // Shift tasks after insertion point
      const tasksToShift = siblings.slice(targetIndex + 1);
      if (tasksToShift.length > 0) {
        const batchUpdates = tasksToShift.map((t) => ({
          id: t.id,
          data: { sort_order: t.sort_order + totalTasksToCopy * 10 },
        }));
        await bulkUpdateTasks.mutateAsync({ projectId, updates: batchUpdates });
      }

      // Copy the main task
      const idMap = new Map<string, string>();
      const newSortOrder = targetTask.sort_order + 1;

      const copiedTask = await addTask.mutateAsync({
        project_id: projectId,
        parent_id: targetTask.parent_id,
        name: targetTask.name,
        start_date: targetTask.start_date,
        end_date: targetTask.end_date,
        duration: targetTask.duration,
        progress: targetTask.progress,
        predecessors: [],
        assignees: targetTask.assignees,
        effort_per_assignee: targetTask.effort_per_assignee,
        sort_order: newSortOrder,
        is_milestone: targetTask.is_milestone,
        notes: targetTask.notes,
      });

      idMap.set(taskId, copiedTask.id);

      // Copy all descendants
      descendants.sort((a, b) => a.sort_order - b.sort_order);
      for (const descendant of descendants) {
        const newParentId = idMap.get(descendant.parent_id!) || copiedTask.id;

        const copiedDescendant = await addTask.mutateAsync({
          project_id: projectId,
          parent_id: newParentId,
          name: descendant.name,
          start_date: descendant.start_date,
          end_date: descendant.end_date,
          duration: descendant.duration,
          progress: descendant.progress,
          predecessors: [],
          assignees: descendant.assignees,
          effort_per_assignee: descendant.effort_per_assignee,
          sort_order: descendant.sort_order,
          is_milestone: descendant.is_milestone,
          notes: descendant.notes,
        });

        idMap.set(descendant.id, copiedDescendant.id);
      }

      setSelectedTaskIds(new Set([copiedTask.id]));

      // Expand parent if exists
      if (targetTask.parent_id && !expandedTasks.has(targetTask.parent_id)) {
        const next = new Set(expandedTasks);
        next.add(targetTask.parent_id);
        handleExpandedTasksChange(next);
      }

      toast.success('Đã copy task');
    },
    [
      tasks,
      addTask,
      bulkUpdateTasks,
      projectId,
      expandedTasks,
      handleExpandedTasksChange,
    ]
  );

  const handleContextMoveUp = useCallback(
    async (taskId: string) => {
      const targetTask = tasks.find((t) => t.id === taskId);
      if (!targetTask) return;

      const siblings = tasks
        .filter((t) => t.parent_id === targetTask.parent_id)
        .sort((a, b) => a.sort_order - b.sort_order);

      const currentIndex = siblings.findIndex((t) => t.id === taskId);
      if (currentIndex <= 0) {
        toast.error('Task đã ở vị trí đầu tiên');
        return;
      }

      const prevTask = siblings[currentIndex - 1];

      await bulkUpdateTasks.mutateAsync({
        projectId,
        updates: [
          { id: taskId, data: { sort_order: prevTask.sort_order } },
          { id: prevTask.id, data: { sort_order: targetTask.sort_order } },
        ],
      });

      toast.success('Đã di chuyển task lên');
    },
    [tasks, bulkUpdateTasks, projectId]
  );

  const handleContextMoveDown = useCallback(
    async (taskId: string) => {
      const targetTask = tasks.find((t) => t.id === taskId);
      if (!targetTask) return;

      const siblings = tasks
        .filter((t) => t.parent_id === targetTask.parent_id)
        .sort((a, b) => a.sort_order - b.sort_order);

      const currentIndex = siblings.findIndex((t) => t.id === taskId);
      if (currentIndex >= siblings.length - 1) {
        toast.error('Task đã ở vị trí cuối cùng');
        return;
      }

      const nextTask = siblings[currentIndex + 1];

      await bulkUpdateTasks.mutateAsync({
        projectId,
        updates: [
          { id: taskId, data: { sort_order: nextTask.sort_order } },
          { id: nextTask.id, data: { sort_order: targetTask.sort_order } },
        ],
      });

      toast.success('Đã di chuyển task xuống');
    },
    [tasks, bulkUpdateTasks, projectId]
  );
  const handleSyncAllocations = useCallback(
    async (syncStartDate?: Date, syncEndDate?: Date) => {
      const allocationsToSet: {
        employeeId: string;
        projectId: string;
        date: string;
        effort: number;
        source: 'gantt' | 'manual';
      }[] = [];

      // Use provided range or default to all tasks
      const filterStart = syncStartDate
        ? format(syncStartDate, 'yyyy-MM-dd')
        : null;
      const filterEnd = syncEndDate ? format(syncEndDate, 'yyyy-MM-dd') : null;

      tasks.forEach((task) => {
        if (!task.start_date || !task.end_date || !task.assignees?.length)
          return;
        if (task.effort_per_assignee <= 0) return;

        // Filter tasks within the date range
        if (filterStart && task.end_date < filterStart) return;
        if (filterEnd && task.start_date > filterEnd) return;

        const taskStartDate = parseISO(task.start_date);
        const taskEndDate = parseISO(task.end_date);

        // Determine actual range to sync
        const actualStart =
          filterStart && filterStart > task.start_date
            ? parseISO(filterStart)
            : taskStartDate;
        const actualEnd =
          filterEnd && filterEnd < task.end_date
            ? parseISO(filterEnd)
            : taskEndDate;

        const days = eachDayOfInterval({
          start: actualStart,
          end: actualEnd,
        });

        task.assignees.forEach((assigneeId) => {
          days.forEach((day) => {
            // Skip non-working days
            if (isNonWorkingDay(day)) return;

            allocationsToSet.push({
              employeeId: assigneeId,
              projectId,
              date: format(day, 'yyyy-MM-dd'),
              effort: task.effort_per_assignee,
              source: 'gantt' as const,
            });
          });
        });
      });

      try {
        // First, delete all existing gantt-sourced allocations for this project within the date range
        // This ensures removed tasks or changed dates don't leave orphan allocations
        let deleteQuery = supabase
          .from('allocations')
          .delete()
          .eq('project_id', projectId)
          .eq('source', 'gantt');

        if (filterStart) {
          deleteQuery = deleteQuery.gte('date', filterStart);
        }
        if (filterEnd) {
          deleteQuery = deleteQuery.lte('date', filterEnd);
        }

        const { error: deleteError } = await deleteQuery;
        if (deleteError) throw deleteError;

        // Then insert new allocations
        if (allocationsToSet.length > 0) {
          await bulkSetAllocations.mutateAsync(allocationsToSet);
        }

        // Update last sync info on project
        await updateProject.mutateAsync({
          id: projectId,
          data: {
            last_sync_at: new Date().toISOString(),
            last_sync_by: user?.id || null,
          },
        });

        toast.success(`Đã đồng bộ ${allocationsToSet.length} allocation`);
      } catch (error) {
        console.error('Sync error:', error);
        toast.error('Lỗi khi đồng bộ nguồn lực');
      }
    },
    [tasks, projectId, bulkSetAllocations, isNonWorkingDay, updateProject, user]
  );

  // Export to CSV
  const handleExportCSV = useCallback(() => {
    const headers = [
      'ID',
      'Name',
      'Start Date',
      'End Date',
      'Duration',
      'Progress',
      'Effort',
      'Assignees',
      'Predecessors',
      'Notes',
    ];

    const rows = tasks.map((task, idx) => {
      const assigneeNames =
        task.assignees
          ?.map((id) => {
            const emp = allEmployees.find((e) => e.id === id);
            return emp?.name || id;
          })
          .join('; ') || '';

      // Predecessor IDs as numeric task IDs only
      const predecessorIds =
        task.predecessors
          ?.map((id) => {
            const predIdx = tasks.findIndex((t) => t.id === id);
            return predIdx >= 0 ? (predIdx + 1).toString() : '';
          })
          .filter(Boolean)
          .join('; ') || '';

      return [
        (idx + 1).toString(), // Task ID (1-based)
        task.name,
        task.start_date || '',
        task.end_date || '',
        task.duration?.toString() || '1',
        task.progress?.toString() || '0',
        task.effort_per_assignee?.toString() || '0',
        assigneeNames,
        predecessorIds,
        task.notes || '',
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tasks_export_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
    link.click();

    toast.success('Đã export file CSV');
  }, [tasks, allEmployees]);

  // Import from CSV
  const handleImportCSV = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const processCSVImport = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter((line) => line.trim());

          if (lines.length < 2) {
            toast.error('File CSV không có dữ liệu');
            return;
          }

          // Skip header row
          const dataRows = lines.slice(1);
          let importedCount = 0;
          const createdTaskIds: string[] = [];

          // First pass: create all tasks without predecessors
          for (const row of dataRows) {
            // Parse CSV row (handle quoted values)
            const values: string[] = [];
            let current = '';
            let inQuotes = false;

            for (let i = 0; i < row.length; i++) {
              const char = row[i];
              if (char === '"') {
                if (inQuotes && row[i + 1] === '"') {
                  current += '"';
                  i++;
                } else {
                  inQuotes = !inQuotes;
                }
              } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
              } else {
                current += char;
              }
            }
            values.push(current.trim());

            // Format: ID, Name, Start Date, End Date, Duration, Progress, Effort, Assignees, Predecessors, Notes
            const [_id, name, startDate, endDate, duration, progress, effort] =
              values;

            if (!name) {
              createdTaskIds.push('');
              continue;
            }

            const result = await addTask.mutateAsync({
              project_id: projectId,
              name,
              start_date: startDate || null,
              end_date: endDate || null,
              duration: parseInt(duration) || 1,
              progress: parseInt(progress) || 0,
              effort_per_assignee: parseFloat(effort) || 0,
              sort_order: tasks.length + importedCount,
            } as any);

            createdTaskIds.push(result.id);
            importedCount++;
          }

          // Second pass: update predecessors
          for (let i = 0; i < dataRows.length; i++) {
            const row = dataRows[i];
            const values: string[] = [];
            let current = '';
            let inQuotes = false;

            for (let j = 0; j < row.length; j++) {
              const char = row[j];
              if (char === '"') {
                if (inQuotes && row[j + 1] === '"') {
                  current += '"';
                  j++;
                } else {
                  inQuotes = !inQuotes;
                }
              } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
              } else {
                current += char;
              }
            }
            values.push(current.trim());

            const predecessorsStr = values[8]; // Predecessors column
            const taskId = createdTaskIds[i];

            if (taskId && predecessorsStr) {
              const predecessorNums = predecessorsStr
                .split(/[;,\s]+/)
                .filter(Boolean)
                .map((s) => parseInt(s.trim()));
              const predecessorIds = predecessorNums
                .filter((num) => num > 0 && num <= createdTaskIds.length)
                .map((num) => createdTaskIds[num - 1])
                .filter(Boolean);

              if (predecessorIds.length > 0) {
                await updateTask.mutateAsync({
                  id: taskId,
                  projectId,
                  data: { predecessors: predecessorIds },
                });
              }
            }
          }

          toast.success(`Đã import ${importedCount} task`);
        } catch (error) {
          console.error('Import error:', error);
          toast.error('Lỗi khi import file CSV');
        }
      };

      reader.readAsText(file);
      event.target.value = ''; // Reset input
    },
    [addTask, projectId, tasks.length, updateTask]
  );

  // Generate fake data with hierarchical structure
  const handleGenerateFakeData = useCallback(async () => {
    const createdTaskIds: string[] = [];
    let sortOrder = tasks.length;
    const taskStartDates: Date[] = [];
    const taskEndDates: Date[] = [];
    let currentDate = new Date();

    for (let i = 0; i < FAKE_TASKS_DEFS.length; i++) {
      const fakeTask = FAKE_TASKS_DEFS[i];

      // Calculate start date
      let startDateObj: Date;
      const predecessorIds: string[] = [];

      if (
        fakeTask.predecessorOffsets &&
        fakeTask.predecessorOffsets.length > 0
      ) {
        // Find latest end date from predecessors
        let latestEndDate: Date | null = null;

        for (const offset of fakeTask.predecessorOffsets) {
          const predIndex = i + offset;
          if (predIndex >= 0 && predIndex < createdTaskIds.length) {
            predecessorIds.push(createdTaskIds[predIndex]);
            const predEndDate = taskEndDates[predIndex];
            if (
              predEndDate &&
              (!latestEndDate || predEndDate > latestEndDate)
            ) {
              latestEndDate = predEndDate;
            }
          }
        }

        startDateObj = latestEndDate
          ? getNextWorkingDay(latestEndDate)
          : new Date(currentDate);
      } else if (
        fakeTask.parentIndex !== undefined &&
        taskStartDates[fakeTask.parentIndex]
      ) {
        // Child task starts when parent starts (or after previous sibling)
        startDateObj = new Date(taskStartDates[fakeTask.parentIndex]);
      } else {
        startDateObj = new Date(currentDate);
      }

      // Calculate end date
      const duration = fakeTask.duration || 1;
      const endDateObj = addWorkingDays(startDateObj, duration);

      // Store dates for reference
      taskStartDates[i] = startDateObj;
      taskEndDates[i] = endDateObj;

      // Get parent_id if this is a child task
      const parentId =
        fakeTask.parentIndex !== undefined
          ? createdTaskIds[fakeTask.parentIndex]
          : null;

      const result = await addTask.mutateAsync({
        project_id: projectId,
        name: fakeTask.name,
        start_date: format(startDateObj, 'yyyy-MM-dd'),
        end_date: format(endDateObj, 'yyyy-MM-dd'),
        duration: duration,
        progress: fakeTask.progress || 0,
        effort_per_assignee: 1,
        sort_order: sortOrder++,
        is_milestone: false,
        parent_id: parentId,
        predecessors: predecessorIds.length > 0 ? predecessorIds : [],
      } as any);

      createdTaskIds.push(result.id);

      // Update current date tracker for non-child tasks
      if (fakeTask.parentIndex === undefined && !fakeTask.isGroup) {
        currentDate = endDateObj;
      }
    }

    toast.success(
      `Đã tạo ${FAKE_TASKS_DEFS.length} task mẫu với cấu trúc phân cấp`
    );
  }, [addTask, projectId, tasks.length, addWorkingDays, getNextWorkingDay]);

  // Toolbar handlers - creates empty row directly without form
  const handleToolbarAdd = useCallback(async () => {
    // Calculate sort_order at the end of root tasks
    const rootTasks = tasks.filter((t) => !t.parent_id);
    const maxSortOrder =
      rootTasks.length > 0
        ? Math.max(...rootTasks.map((t) => t.sort_order))
        : -1;

    // Create empty task at the end
    const result = await addTask.mutateAsync({
      project_id: projectId,
      name: 'New Task',
      parent_id: null,
      sort_order: maxSortOrder + 1,
      duration: 1,
      progress: 0,
    } as any);

    // Select the new task
    setSelectedTaskIds(new Set([result.id]));
  }, [tasks, addTask, projectId]);

  // Insert row above selected task - creates empty row directly without form
  const handleInsertAbove = useCallback(async () => {
    if (!selectedTaskId) return;
    const selectedTask = tasks.find((t) => t.id === selectedTaskId);
    if (!selectedTask) return;

    // Calculate new sort_order
    const siblings = tasks
      .filter((t) => t.parent_id === selectedTask.parent_id)
      .sort((a, b) => a.sort_order - b.sort_order);

    const selectedIndex = siblings.findIndex((t) => t.id === selectedTaskId);
    let newSortOrder: number;

    if (selectedIndex === 0) {
      // Insert at beginning - use sort_order less than first
      newSortOrder = selectedTask.sort_order;
    } else {
      // Insert between previous task and selected task
      const prevTask = siblings[selectedIndex - 1];
      newSortOrder = prevTask.sort_order + 1;
    }

    // Shift sort_order of selected task and all tasks after it
    const batchUpdates: { id: string; data: Partial<Task> }[] = [];
    siblings.forEach((t, idx) => {
      if (idx >= selectedIndex) {
        batchUpdates.push({ id: t.id, data: { sort_order: t.sort_order + 1 } });
      }
    });

    if (batchUpdates.length > 0) {
      await bulkUpdateTasks.mutateAsync({ projectId, updates: batchUpdates });
    }

    // Create empty task
    const result = await addTask.mutateAsync({
      project_id: projectId,
      name: 'New Task',
      parent_id: selectedTask.parent_id,
      sort_order: newSortOrder,
      duration: 1,
      progress: 0,
    } as any);

    // Select the new task
    setSelectedTaskIds(new Set([result.id]));
  }, [selectedTaskId, tasks, addTask, bulkUpdateTasks, projectId]);

  // Insert row below selected task - creates empty row directly without form
  const handleInsertBelow = useCallback(async () => {
    if (!selectedTaskId) return;
    const selectedTask = tasks.find((t) => t.id === selectedTaskId);
    if (!selectedTask) return;

    // Calculate new sort_order (after selected task)
    const newSortOrder = selectedTask.sort_order + 1;

    // Shift sort_order of all tasks after selected task
    const siblings = tasks
      .filter((t) => t.parent_id === selectedTask.parent_id)
      .sort((a, b) => a.sort_order - b.sort_order);

    const selectedIndex = siblings.findIndex((t) => t.id === selectedTaskId);
    const batchUpdates: { id: string; data: Partial<Task> }[] = [];

    siblings.forEach((t, idx) => {
      if (idx > selectedIndex) {
        batchUpdates.push({ id: t.id, data: { sort_order: t.sort_order + 1 } });
      }
    });

    if (batchUpdates.length > 0) {
      await bulkUpdateTasks.mutateAsync({ projectId, updates: batchUpdates });
    }

    // Create empty task
    const result = await addTask.mutateAsync({
      project_id: projectId,
      name: 'New Task',
      parent_id: selectedTask.parent_id,
      sort_order: newSortOrder,
      duration: 1,
      progress: 0,
    } as any);

    // Select the new task
    setSelectedTaskIds(new Set([result.id]));
  }, [selectedTaskId, tasks, addTask, bulkUpdateTasks, projectId]);

  const handleToolbarEdit = useCallback(() => {
    if (!selectedTaskId) return;
    const task = tasks.find((t) => t.id === selectedTaskId);
    if (task) handleEditTask(task);
  }, [selectedTaskId, tasks, handleEditTask]);

  const handleToolbarDelete = useCallback(() => {
    if (selectedTaskIds.size === 0) return;
    setShowDeleteConfirm(true);
  }, [selectedTaskIds]);

  const handleConfirmDelete = useCallback(async () => {
    for (const taskId of selectedTaskIds) {
      await handleDeleteTask(taskId);
    }
    setSelectedTaskIds(new Set());
    setShowDeleteConfirm(false);
  }, [selectedTaskIds, handleDeleteTask]);

  // Check if all selected tasks are at the same level (same parent_id)
  const canCopyTasks = useMemo(() => {
    if (selectedTaskIds.size === 0) return false;
    const selectedTasks = tasks.filter((t) => selectedTaskIds.has(t.id));
    if (selectedTasks.length === 0) return false;
    const firstParentId = selectedTasks[0].parent_id;
    return selectedTasks.every((t) => t.parent_id === firstParentId);
  }, [selectedTaskIds, tasks]);

  // Copy task(s) - creates copies right below selected tasks
  const handleCopyTask = useCallback(async () => {
    if (selectedTaskIds.size === 0 || !canCopyTasks) return;

    const selectedTasks = tasks.filter((t) => selectedTaskIds.has(t.id));
    if (selectedTasks.length === 0) return;

    // Sort by sort_order to maintain order
    selectedTasks.sort((a, b) => a.sort_order - b.sort_order);

    const parentId = selectedTasks[0].parent_id;
    const siblings = tasks
      .filter((t) => t.parent_id === parentId)
      .sort((a, b) => a.sort_order - b.sort_order);

    // Find the last selected task's position to insert after
    const lastSelectedTask = selectedTasks[selectedTasks.length - 1];
    const lastSelectedIndex = siblings.findIndex(
      (t) => t.id === lastSelectedTask.id
    );

    // Calculate how many tasks we need to shift and the base sort_order
    // First, shift all tasks after the last selected task
    const tasksToShift = siblings.slice(lastSelectedIndex + 1);

    // Helper to get all descendants recursively
    const getAllDescendants = (taskId: string): Task[] => {
      const children = tasks.filter((t) => t.parent_id === taskId);
      const descendants: Task[] = [...children];
      children.forEach((child) => {
        descendants.push(...getAllDescendants(child.id));
      });
      return descendants;
    };

    // Count total tasks to copy (selected + their descendants)
    let totalTasksToCopy = 0;
    selectedTasks.forEach((task) => {
      totalTasksToCopy += 1 + getAllDescendants(task.id).length;
    });

    // Shift tasks after insertion point
    if (tasksToShift.length > 0) {
      const batchUpdates = tasksToShift.map((t) => ({
        id: t.id,
        data: { sort_order: t.sort_order + totalTasksToCopy * 10 },
      }));
      await bulkUpdateTasks.mutateAsync({ projectId, updates: batchUpdates });
    }

    // Copy each selected task and its descendants
    const newTaskIds: string[] = [];
    let sortOrderOffset = 0;

    for (const originalTask of selectedTasks) {
      // Create a map of old IDs to new IDs for parent reference
      const idMap = new Map<string, string>();

      // Copy the main task
      const newSortOrder = lastSelectedTask.sort_order + 1 + sortOrderOffset;
      const copiedTask = await addTask.mutateAsync({
        project_id: projectId,
        parent_id: parentId,
        name: originalTask.name,
        start_date: originalTask.start_date,
        end_date: originalTask.end_date,
        duration: originalTask.duration,
        progress: originalTask.progress,
        predecessors: [], // Don't copy predecessors as they refer to old tasks
        assignees: originalTask.assignees,
        effort_per_assignee: originalTask.effort_per_assignee,
        sort_order: newSortOrder,
        is_milestone: originalTask.is_milestone,
        notes: originalTask.notes,
      });

      idMap.set(originalTask.id, copiedTask.id);
      newTaskIds.push(copiedTask.id);
      sortOrderOffset++;

      // Copy all descendants (children, grandchildren, etc.)
      const descendants = getAllDescendants(originalTask.id);
      descendants.sort((a, b) => a.sort_order - b.sort_order);

      for (const descendant of descendants) {
        const newParentId = idMap.get(descendant.parent_id!) || copiedTask.id;

        const copiedDescendant = await addTask.mutateAsync({
          project_id: projectId,
          parent_id: newParentId,
          name: descendant.name,
          start_date: descendant.start_date,
          end_date: descendant.end_date,
          duration: descendant.duration,
          progress: descendant.progress,
          predecessors: [], // Don't copy predecessors
          assignees: descendant.assignees,
          effort_per_assignee: descendant.effort_per_assignee,
          sort_order: descendant.sort_order,
          is_milestone: descendant.is_milestone,
          notes: descendant.notes,
        });

        idMap.set(descendant.id, copiedDescendant.id);
        sortOrderOffset++;
      }
    }

    // Select the newly created tasks
    setSelectedTaskIds(new Set(newTaskIds));

    // Expand parent if exists to show new tasks
    if (parentId && !expandedTasks.has(parentId)) {
      const next = new Set(expandedTasks);
      next.add(parentId);
      handleExpandedTasksChange(next);
    }

    toast.success(
      `Đã copy ${selectedTasks.length} task${
        selectedTasks.length > 1 ? 's' : ''
      }`
    );
  }, [
    selectedTaskIds,
    canCopyTasks,
    tasks,
    addTask,
    bulkUpdateTasks,
    projectId,
    expandedTasks,
    handleExpandedTasksChange,
  ]);

  const goToPrevious = () => {
    setStartDate((prev) =>
      addMonths(prev, viewMode === 'day' ? -1 : viewMode === 'week' ? -2 : -6)
    );
  };

  const goToNext = () => {
    setStartDate((prev) =>
      addMonths(prev, viewMode === 'day' ? 1 : viewMode === 'week' ? 2 : 6)
    );
  };

  const goToToday = () => {
    setStartDate(startOfMonth(new Date()));
    // Scroll to today after a short delay to allow re-render
    setTimeout(() => {
      ganttPanelsRef.current?.scrollToToday();
    }, 100);
  };

  // Handle viewing a baseline
  const handleViewBaseline = useCallback((baseline: any) => {
    const baselineTasks = (baseline.snapshot as any)?.tasks || [];
    setViewingBaseline({
      id: baseline.id,
      name: baseline.name,
      tasks: baselineTasks,
    });
    setSelectedTaskIds(new Set());
  }, []);

  const handleExitBaselineView = useCallback(() => {
    setViewingBaseline(null);
    setSelectedTaskIds(new Set());
  }, []);

  // Channel ID for collaboration
  const collaborationChannelId = `project:${projectId}:gantt`;

  // Calculate selected tasks text style for toolbar
  const selectedTasksTextStyle = useMemo(() => {
    if (selectedTaskIds.size === 0) return null;
    const tasksSource = viewingBaseline ? viewingBaseline.tasks : tasks;
    const selectedTasks = tasksSource.filter((t) => selectedTaskIds.has(t.id));
    if (selectedTasks.length === 0) return null;

    const styles = selectedTasks.map((t) => t.text_style || null);
    const firstStyle = styles[0];
    const allSame = styles.every((s) => s === firstStyle);

    return allSame ? firstStyle : 'mixed';
  }, [selectedTaskIds, tasks, viewingBaseline]);

  // Toggle bold for selected tasks
  const handleToggleBold = useCallback(() => {
    if (selectedTaskIds.size === 0) return;
    const tasksSource = viewingBaseline ? viewingBaseline.tasks : tasks;
    const selectedTasks = tasksSource.filter((t) => selectedTaskIds.has(t.id));

    // Determine if we should add or remove bold
    const allHaveBold = selectedTasks.every(
      (t) => t.text_style === 'bold' || t.text_style === 'bold-italic'
    );

    const updates = selectedTasks.map((task) => {
      const currentStyle = task.text_style || '';
      const isBold = currentStyle === 'bold' || currentStyle === 'bold-italic';
      const isItalic =
        currentStyle === 'italic' || currentStyle === 'bold-italic';

      let newStyle: string | null;
      if (allHaveBold) {
        // Remove bold
        newStyle = isItalic ? 'italic' : null;
      } else {
        // Add bold
        newStyle = isItalic ? 'bold-italic' : 'bold';
      }

      return { id: task.id, data: { text_style: newStyle } };
    });

    bulkUpdateTasks.mutate({ projectId, updates });
  }, [selectedTaskIds, tasks, viewingBaseline, bulkUpdateTasks, projectId]);

  // Toggle italic for selected tasks
  const handleToggleItalic = useCallback(() => {
    if (selectedTaskIds.size === 0) return;
    const tasksSource = viewingBaseline ? viewingBaseline.tasks : tasks;
    const selectedTasks = tasksSource.filter((t) => selectedTaskIds.has(t.id));

    // Determine if we should add or remove italic
    const allHaveItalic = selectedTasks.every(
      (t) => t.text_style === 'italic' || t.text_style === 'bold-italic'
    );

    const updates = selectedTasks.map((task) => {
      const currentStyle = task.text_style || '';
      const isBold = currentStyle === 'bold' || currentStyle === 'bold-italic';
      const isItalic =
        currentStyle === 'italic' || currentStyle === 'bold-italic';

      let newStyle: string | null;
      if (allHaveItalic) {
        // Remove italic
        newStyle = isBold ? 'bold' : null;
      } else {
        // Add italic
        newStyle = isBold ? 'bold-italic' : 'italic';
      }

      return { id: task.id, data: { text_style: newStyle } };
    });

    bulkUpdateTasks.mutate({ projectId, updates });
  }, [selectedTaskIds, tasks, viewingBaseline, bulkUpdateTasks, projectId]);

  return (
    <CollaborationOverlay channelId={collaborationChannelId} showCursors={true}>
      <div className="absolute bottom-[50px] top-0 left-0 right-0">
        {/* Hidden file input for CSV import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={processCSVImport}
        />

        {/* Baseline viewing banner */}
        {viewingBaseline && (
          <div className="flex items-center justify-between px-3 py-2 bg-amber-500/20 border-b border-amber-500/30">
            <div className="flex items-center gap-2 text-sm">
              <Eye className="w-4 h-4 text-amber-600" />
              <span className="font-medium text-amber-700 dark:text-amber-400">
                Đang xem baseline: {viewingBaseline.name}
              </span>
              <span className="text-xs text-amber-600 dark:text-amber-500">
                (Chỉ đọc - {viewingBaseline.tasks.length} tasks)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="default"
                className="h-7 text-xs"
                onClick={() => setShowRestoreBaselineConfirm(true)}
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Khôi phục baseline này
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-amber-500/50 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20"
                onClick={handleExitBaselineView}
              >
                <ArrowLeft className="w-3 h-3 mr-1" />
                Quay về bản hiện hành
              </Button>
            </div>
          </div>
        )}

        {/* Restore baseline confirmation dialog */}
        <AlertDialog
          open={showRestoreBaselineConfirm}
          onOpenChange={setShowRestoreBaselineConfirm}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Khôi phục baseline này?</AlertDialogTitle>
              <AlertDialogDescription>
                Thao tác này sẽ thay thế toàn bộ dữ liệu tasks và allocations
                hiện tại bằng dữ liệu từ baseline "{viewingBaseline?.name}".
                Hành động này không thể hoàn tác. Bạn có chắc chắn muốn tiếp
                tục?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  if (viewingBaseline) {
                    await restoreBaseline.mutateAsync({
                      baselineId: viewingBaseline.id,
                      projectId,
                    });
                    setViewingBaseline(null);
                    setShowRestoreBaselineConfirm(false);
                  }
                }}
                disabled={restoreBaseline.isPending}
                className="bg-primary"
              >
                {restoreBaseline.isPending && (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                )}
                Xác nhận khôi phục
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Toolbar with view controls */}
        {!isReadOnly && (
          <GanttToolbar
            selectedTaskId={selectedTaskId}
            selectedCount={selectedTaskIds.size}
            canMultiIndent={areSelectedTasksSameLevel}
            canCopy={canCopyTasks}
            viewMode={viewMode}
            customViewMode={customViewMode}
            startDate={startDate}
            endDate={endDate}
            taskBarLabels={taskBarLabels}
            selectedTasksTextStyle={selectedTasksTextStyle}
            collaborationSlot={
              <CollaborationAvatars channelId={collaborationChannelId} />
            }
            onAddTask={handleToolbarAdd}
            onInsertAbove={handleInsertAbove}
            onInsertBelow={handleInsertBelow}
            onEditTask={handleToolbarEdit}
            onDeleteTask={handleToolbarDelete}
            onCopyTask={handleCopyTask}
            onIndent={handleIndent}
            onOutdent={handleOutdent}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            onToggleBold={handleToggleBold}
            onToggleItalic={handleToggleItalic}
            onSyncAllocations={handleSyncAllocations}
            onImportCSV={handleImportCSV}
            onExportCSV={handleExportCSV}
            onGenerateFakeData={handleGenerateFakeData}
            onOpenBaselines={() => setShowBaselineDialog(true)}
            onViewModeChange={(m) => {
              setViewMode(m);
              setCustomViewMode(false);
            }}
            onCustomRangeChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
              setCustomViewMode(true);
            }}
            onGoToPrevious={goToPrevious}
            onGoToNext={goToNext}
            onGoToToday={goToToday}
            onTaskBarLabelsChange={handleTaskBarLabelsChange}
            filterEmployees={projectMembers.map((m) => ({
              id: m.id,
              name: m.name,
              code: allEmployees.find((e) => e.id === m.id)?.code || '',
            }))}
            filterAssigneeIds={filterAssigneeIds}
            projectId={projectId}
            onFilterAssigneesChange={setFilterAssigneeIds}
          />
        )}

        {/* Main content with resizable panels */}
        <GanttPanels
          ref={ganttPanelsRef}
          flatTasks={filteredFlatTasks}
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
          onSelectTask={handleSelectTask}
          onToggleExpand={toggleTaskExpansion}
          onAddTask={handleAddTask}
          onInsertAbove={handleContextInsertAbove}
          onEditTask={handleEditTask}
          onDeleteTask={handleDeleteTask}
          onCopyTask={handleContextCopyTask}
          onMoveUp={handleContextMoveUp}
          onMoveDown={handleContextMoveDown}
          onUpdateField={handleUpdateTaskField}
          onColumnsChange={handleColumnsChange}
        />

        {/* Task Form Dialog */}
        <TaskFormDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          task={editingTask}
          tasks={tasks}
          projectMembers={projectMembers}
          onSave={handleSaveTask}
        />

        {/* Baseline Dialog */}
        <BaselineDialog
          open={showBaselineDialog}
          onOpenChange={setShowBaselineDialog}
          projectId={projectId}
          tasks={tasks}
          allocations={allocations}
          onViewBaseline={handleViewBaseline}
        />

        {/* Delete Confirm Dialog */}
        <AlertDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
              <AlertDialogDescription>
                {selectedTaskIds.size > 1
                  ? `Bạn có chắc muốn xóa ${selectedTaskIds.size} task đã chọn?`
                  : 'Bạn có chắc muốn xóa task này?'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete}>
                Xóa
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </CollaborationOverlay>
  );
}
