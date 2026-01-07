/**
 * Mock Database Adapter
 * Returns fake data for development/testing
 * Sử dụng services với store để đảm bảo data persistence
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { createGanttServices } from '../services/factory';

let mockTasks = [
  {
    id: '1',
    project_id: 'test-project',
    name: 'Task 1',
    parent_id: null,
    status: 'not_started',
    start_date: '2024-01-01',
    end_date: '2024-01-05',
    duration: 5,
    progress: 0,
    sort_order: 0,
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    project_id: 'test-project',
    name: 'Task 2',
    parent_id: '1',
    status: 'in_progress',
    start_date: '2024-01-02',
    end_date: '2024-01-08',
    duration: 6,
    progress: 50,
    sort_order: 0,
    created_at: new Date().toISOString(),
  },
];

let mockAllocations: any[] = [];
let taskIdCounter = 2;

function parseUpdateTaskArgs(...args: any[]) {
  if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null) {
    const { id, projectId, data } = args[0];
    return { taskId: id, projectId, data };
  }
  const [taskId, projectId, data] = args;
  return { taskId, projectId, data };
}

function parseDeleteTaskArgs(...args: any[]) {
  if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null) {
    const { id, projectId } = args[0];
    return { taskId: id, projectId };
  }
  const [taskId, projectId] = args;
  return { taskId, projectId };
}

function parseBulkUpdateArgs(...args: any[]) {
  if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null) {
    const { projectId, updates } = args[0];
    return { projectId, updates };
  }
  const [projectId, updates] = args;
  return { projectId, updates };
}

function parseBulkAllocationsArgs(...args: any[]) {
  if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null) {
    const { projectId, allocations } = args[0];
    return { projectId, allocations };
  }
  const [projectId, allocations] = args;
  return { projectId, allocations };
}

export function createMockDatabaseAdapter(
  supabaseClient: SupabaseClient
): Record<string, any> {
  // Tạo services để sử dụng store
  const services = createGanttServices(supabaseClient);
  return {
    supabaseClient,

    // ==================== Tasks ====================
    // Sử dụng service để đảm bảo data được lưu vào store
    getTasks: async (projectId: string) => {
      return services.task.getTasks(projectId);
    },

    addTask: async (taskData: any) => {
      return services.task.createTask(taskData);
    },

    updateTask: async (...args: any[]) => {
      const { taskId, projectId, data } = parseUpdateTaskArgs(...args);
      return services.task.updateTask(taskId, data);
    },

    deleteTask: async (...args: any[]) => {
      const { taskId, projectId } = parseDeleteTaskArgs(...args);
      return services.task.deleteTask(taskId);
    },

    bulkUpdateTasks: async (...args: any[]) => {
      const { projectId, updates } = parseBulkUpdateArgs(...args);
      const bulkUpdates = updates.map(update => ({
        id: update.id,
        updates: update.data
      }));
      return services.task.bulkUpdateTasks(bulkUpdates);
    },

    // ==================== Allocations ====================
    // Sử dụng service để đảm bảo data được lưu vào store
    getAllocations: async (projectId: string) => {
      return services.allocation.getAllocations({ projectId });
    },

    bulkSetAllocations: async (...args: any[]) => {
      const { projectId, allocations } = parseBulkAllocationsArgs(...args);
      const bulkAllocations = (allocations || []).map(alloc => ({
        employeeId: alloc.employee_id,
        projectId: projectId,
        date: alloc.date,
        effort: alloc.effort,
        source: alloc.source || 'manual'
      }));
      return services.allocation.bulkSetAllocations(bulkAllocations);
    },

    // ==================== Employees ====================
    getEmployees: async () => {
      return [
        { id: '1', name: 'John Doe', email: 'john@example.com' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
        { id: '3', name: 'Bob Johnson', email: 'bob@example.com' },
      ];
    },

    // ==================== Task Statuses ====================
    // Sử dụng service để đảm bảo data được lưu vào store
    getTaskStatuses: async (projectId: string) => {
      return services.task.getTaskStatuses(projectId);
    },

    addTaskStatus: async (status: any) => {
      return services.task.createTaskStatus(status);
    },

    updateTaskStatus: async (id: string, updates: any) => {
      return services.task.updateTaskStatus(id, updates);
    },

    deleteTaskStatus: async (id: string) => {
      return services.task.deleteTaskStatus(id);
    },

    // ==================== Task Labels ====================
    // Sử dụng service để đảm bảo data được lưu vào store
    getTaskLabels: async (projectId: string) => {
      return services.task.getTaskLabels(projectId);
    },

    addTaskLabel: async (label: any) => {
      return services.task.createTaskLabel(label);
    },

    updateTaskLabel: async (id: string, updates: any) => {
      return services.task.updateTaskLabel(id, updates);
    },

    deleteTaskLabel: async (id: string) => {
      return services.task.deleteTaskLabel(id);
    },

    // ==================== Project Milestones ====================
    // Sử dụng service để đảm bảo data được lưu vào store
    getProjectMilestones: async (projectId: string) => {
      return services.settings.getProjectMilestones(projectId);
    },

    addProjectMilestone: async (milestone: any) => {
      return services.settings.createProjectMilestone(milestone);
    },

    updateProjectMilestone: async (id: string, updates: any) => {
      return services.settings.updateProjectMilestone(id, updates);
    },

    deleteProjectMilestone: async (id: string) => {
      return services.settings.deleteProjectMilestone(id);
    },

    // ==================== Baselines ====================
    // Sử dụng service để đảm bảo data được lưu vào store
    getBaselines: async (projectId: string) => {
      return services.settings.getBaselines(projectId);
    },

    addBaseline: async (baseline: any) => {
      return services.settings.createBaseline(baseline);
    },

    deleteBaseline: async (id: string) => {
      return services.settings.deleteBaseline(id);
    },

    restoreBaseline: async (id: string) => {
      // restoreBaseline cần projectId, nhưng adapter chỉ nhận id
      // Cần parse từ baseline hoặc truyền thêm projectId
      const baselines = await services.settings.getBaselines('');
      const baseline = baselines.find(b => b.id === id);
      if (baseline) {
        return services.settings.restoreBaseline(id, baseline.project_id);
      }
      throw new Error(`Baseline ${id} not found`);
    },

    // ==================== View Settings ====================
    // Sử dụng service để đảm bảo data được lưu vào store
    getViewSettings: async () => {
      const settings = await services.settings.getViewSettings();
      return { data: settings, isLoading: false };
    },

    saveViewSettings: async (settings: any) => {
      await services.settings.saveViewSettings(settings);
    },

    // ==================== Project ====================
    updateProject: async (projectId: string, updates: any) => {
      console.log('Mock: Project updated', projectId, updates);
    },
  };
}
