/**
 * Mock Database Adapter
 * Provides mock data for testing Gantt feature without API calls
 * Switch between mock and real adapters by changing the import in configureGantt
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// Mock data storage - in production this would be API calls
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
  return {
    supabaseClient,

    // ==================== Tasks ====================
    getTasks: async (projectId: string) => {
      return mockTasks.filter((t) => t.project_id === projectId);
    },

    addTask: async (taskData: any) => {
      const newTask = {
        id: String(++taskIdCounter),
        project_id: taskData.project_id,
        ...taskData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockTasks.push(newTask);
      console.log('Mock: Task created', newTask);
      return newTask;
    },

    updateTask: async (...args: any[]) => {
      const { taskId, projectId, data } = parseUpdateTaskArgs(...args);
      const task = mockTasks.find((t) => t.id === taskId && t.project_id === projectId);
      if (!task) throw new Error('Task not found');
      Object.assign(task, data, { updated_at: new Date().toISOString() });
      console.log('Mock: Task updated', task);
      return task;
    },

    deleteTask: async (...args: any[]) => {
      const { taskId, projectId } = parseDeleteTaskArgs(...args);
      mockTasks = mockTasks.filter((t) => !(t.id === taskId && t.project_id === projectId));
      console.log('Mock: Task deleted', taskId);
    },

    bulkUpdateTasks: async (...args: any[]) => {
      const { projectId, updates } = parseBulkUpdateArgs(...args);
      updates.forEach((update) => {
        const task = mockTasks.find((t) => t.id === update.id && t.project_id === projectId);
        if (task) {
          Object.assign(task, update.data, { updated_at: new Date().toISOString() });
        }
      });
      console.log('Mock: Tasks bulk updated');
    },

    // ==================== Allocations ====================
    getAllocations: async (projectId: string) => {
      return mockAllocations.filter((a) => a.project_id === projectId);
    },

    bulkSetAllocations: async (...args: any[]) => {
      const { projectId, allocations } = parseBulkAllocationsArgs(...args);
      mockAllocations = mockAllocations.filter((a) => a.project_id !== projectId);
      (allocations || []).forEach((alloc) => {
        mockAllocations.push({
          ...alloc,
          project_id: projectId,
        });
      });
      console.log('Mock: Allocations bulk set');
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
    getTaskStatuses: async (projectId: string) => {
      return [
        { id: '1', name: 'Not Started', color: '#gray', order: 0, project_id: projectId },
        { id: '2', name: 'In Progress', color: '#blue', order: 1, project_id: projectId },
        { id: '3', name: 'Completed', color: '#green', order: 2, project_id: projectId },
      ];
    },

    addTaskStatus: async (status: any) => {
      const newStatus = { id: String(Math.random()), ...status };
      console.log('Mock: Task status created', newStatus);
      return newStatus;
    },

    updateTaskStatus: async (id: string, updates: any) => {
      console.log('Mock: Task status updated', id, updates);
    },

    deleteTaskStatus: async (id: string) => {
      console.log('Mock: Task status deleted', id);
    },

    // ==================== Task Labels ====================
    getTaskLabels: async (projectId: string) => {
      return [
        { id: '1', name: 'Bug', color: '#red', project_id: projectId },
        { id: '2', name: 'Feature', color: '#green', project_id: projectId },
        { id: '3', name: 'Documentation', color: '#blue', project_id: projectId },
      ];
    },

    addTaskLabel: async (label: any) => {
      const newLabel = { id: String(Math.random()), ...label };
      console.log('Mock: Task label created', newLabel);
      return newLabel;
    },

    updateTaskLabel: async (id: string, updates: any) => {
      console.log('Mock: Task label updated', id, updates);
    },

    deleteTaskLabel: async (id: string) => {
      console.log('Mock: Task label deleted', id);
    },

    // ==================== Project Milestones ====================
    getProjectMilestones: async (projectId: string) => {
      return [
        {
          id: '1',
          project_id: projectId,
          name: 'Phase 1 Complete',
          date: '2024-03-01',
          color: '#blue',
        },
        {
          id: '2',
          project_id: projectId,
          name: 'Phase 2 Complete',
          date: '2024-06-01',
          color: '#green',
        },
      ];
    },

    addProjectMilestone: async (milestone: any) => {
      const newMilestone = { id: String(Math.random()), ...milestone };
      console.log('Mock: Milestone created', newMilestone);
      return newMilestone;
    },

    updateProjectMilestone: async (id: string, updates: any) => {
      console.log('Mock: Milestone updated', id, updates);
    },

    deleteProjectMilestone: async (id: string) => {
      console.log('Mock: Milestone deleted', id);
    },

    // ==================== Baselines ====================
    getBaselines: async (projectId: string) => {
      return [
        {
          id: '1',
          project_id: projectId,
          name: 'Baseline 1',
          created_at: new Date().toISOString(),
          created_by: 'user1',
        },
      ];
    },

    addBaseline: async (baseline: any) => {
      const newBaseline = {
        id: String(Math.random()),
        ...baseline,
        created_at: new Date().toISOString(),
      };
      console.log('Mock: Baseline created', newBaseline);
      return newBaseline;
    },

    deleteBaseline: async (id: string) => {
      console.log('Mock: Baseline deleted', id);
    },

    restoreBaseline: async (id: string) => {
      console.log('Mock: Baseline restored', id);
    },

    // ==================== View Settings ====================
    saveViewSettings: async (settings: any) => {
      console.log('Mock: View settings saved', settings);
      return settings;
    },

    // ==================== Project ====================
    updateProject: async (projectId: string, updates: any) => {
      console.log('Mock: Project updated', projectId, updates);
    },
  };
}
