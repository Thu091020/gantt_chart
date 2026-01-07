/**
 * useDataIO Hook
 * Chứa logic Import/Export CSV và Fake Data
 * - handleExportCSV: Xuất dữ liệu task ra file CSV
 * - handleImportCSV: Mở dialog chọn file CSV
 * - processCSVImport: Xử lý import file CSV
 * - handleGenerateFakeData: Tạo dữ liệu mẫu (fake data)
 */

import { useCallback } from 'react';
import { format } from 'date-fns';
import { toast } from '../../../components/internal/utils';
import { Task } from '../../../types/task.types';
import { useAddTask, useUpdateTask } from '../../../context/hooks';
import { useWorkCalendar } from '../../useWorkCalendar';

interface FakeTaskDef {
  name: string;
  duration: number;
  progress: number;
  isGroup?: boolean;
  parentIndex?: number;
  predecessorOffsets?: number[];
}

const FAKE_TASKS_DEFS: FakeTaskDef[] = [
  { name: '1. Khởi động dự án', duration: 3, progress: 100, isGroup: true },
  { name: '1.1 Kick-off meeting', duration: 1, progress: 100, parentIndex: 0 },
  {
    name: '1.2 Thiết lập team & công cụ',
    duration: 2,
    progress: 100,
    parentIndex: 0,
    predecessorOffsets: [-1],
  },
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

interface UseDataIOParams {
  projectId: string;
  tasks: Task[];
  allEmployees: any[];
}

export function useDataIO({
  projectId,
  tasks,
  allEmployees,
}: UseDataIOParams) {
  const addTask = useAddTask();
  const updateTask = useUpdateTask();
  const workCalendar = useWorkCalendar();

  /**
   * Export CSV - Xuất dữ liệu task ra file CSV
   */
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

      const predecessorIds = task.predecessors
        ?.map((id) => {
          const predIdx = tasks.findIndex((t) => t.id === id);
          return predIdx >= 0 ? (predIdx + 1).toString() : '';
        })
        .filter(Boolean)
        .join('; ') || '';

      return [
        (idx + 1).toString(),
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

  /**
   * Import CSV - Mở dialog chọn file CSV
   */
  const handleImportCSV = useCallback(
    (fileInputRef: React.RefObject<HTMLInputElement>) => {
      fileInputRef.current?.click();
    },
    []
  );

  /**
   * Process CSV Import - Xử lý import file CSV
   */
  const processCSVImport = useCallback(
    async (
      event: React.ChangeEvent<HTMLInputElement>,
      fileInputRef: React.RefObject<HTMLInputElement>
    ) => {
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

          const dataRows = lines.slice(1);
          let importedCount = 0;
          const createdTaskIds: string[] = [];

          // First pass: create all tasks without predecessors
          for (const row of dataRows) {
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

            const predecessorsStr = values[8];
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
                  taskId,
                  updates: { predecessors: predecessorIds },
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
      event.target.value = '';
    },
    [addTask, projectId, tasks.length, updateTask]
  );

  /**
   * Generate Fake Data - Tạo dữ liệu mẫu (fake data)
   */
  const handleGenerateFakeData = useCallback(async () => {
    const createdTaskIds: string[] = [];
    let sortOrder = tasks.length;
    const taskStartDates: Date[] = [];
    const taskEndDates: Date[] = [];
    let currentDate = new Date();

    for (let i = 0; i < FAKE_TASKS_DEFS.length; i++) {
      const fakeTask = FAKE_TASKS_DEFS[i];

      let startDateObj: Date;
      const predecessorIds: string[] = [];

      if (fakeTask.predecessorOffsets && fakeTask.predecessorOffsets.length > 0) {
        let latestEndDate: Date | null = null;

        for (const offset of fakeTask.predecessorOffsets) {
          const predIndex = i + offset;
          if (predIndex >= 0 && predIndex < createdTaskIds.length) {
            predecessorIds.push(createdTaskIds[predIndex]);
            const predEndDate = taskEndDates[predIndex];
            if (predEndDate && (!latestEndDate || predEndDate > latestEndDate)) {
              latestEndDate = predEndDate;
            }
          }
        }

        startDateObj = latestEndDate
          ? workCalendar.getNextWorkingDay(latestEndDate)
          : new Date(currentDate);
      } else if (
        fakeTask.parentIndex !== undefined &&
        taskStartDates[fakeTask.parentIndex]
      ) {
        startDateObj = new Date(taskStartDates[fakeTask.parentIndex]);
      } else {
        startDateObj = new Date(currentDate);
      }

      const duration = fakeTask.duration || 1;
      const endDateObj = workCalendar.addWorkingDays(startDateObj, duration);

      taskStartDates[i] = startDateObj;
      taskEndDates[i] = endDateObj;

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

      if (fakeTask.parentIndex === undefined && !fakeTask.isGroup) {
        currentDate = endDateObj;
      }
    }

    toast.success(
      `Đã tạo ${FAKE_TASKS_DEFS.length} task mẫu với cấu trúc phân cấp`
    );
  }, [addTask, projectId, tasks.length, workCalendar]);

  return {
    handleExportCSV,
    handleImportCSV,
    processCSVImport,
    handleGenerateFakeData,
  };
}

