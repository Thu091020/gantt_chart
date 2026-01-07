/**
 * Task Mock Service
 * Returns fake data for development/testing with store persistence
 */

import type { ITaskService } from '../interfaces/task.interface';
import type { 
  Task, 
  CreateTaskInput, 
  UpdateTaskInput, 
  BulkUpdateTaskInput,
  TaskLabel,
  TaskStatus 
} from '../../types/task.types';
import { taskStore } from './store/taskStore';

const MOCK_DELAY = 300; // Simulate network delay

export class TaskMockService implements ITaskService {
  private delay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
  }

  // ==================== TASKS ====================
  
  async getTasks(projectId: string): Promise<Task[]> {
    await this.delay();
    return taskStore.tasks.filter(t => t.project_id === projectId);
  }

  async getTaskById(taskId: string): Promise<Task> {
    await this.delay();
    const task = taskStore.tasks.find(t => t.id === taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);
    return task;
  }

  async createTask(input: CreateTaskInput): Promise<Task> {
    await this.delay();
    
    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...input,
      parent_id: input.parent_id || null,
      start_date: input.start_date || null,
      end_date: input.end_date || null,
      duration: input.duration || 1,
      progress: input.progress || 0,
      predecessors: input.predecessors || [],
      assignees: input.assignees || [],
      effort_per_assignee: input.effort_per_assignee || 1,
      sort_order: input.sort_order || taskStore.tasks.length,
      is_milestone: input.is_milestone || false,
      notes: input.notes || null,
      text_style: input.text_style || null,
      label_id: input.label_id || null,
      status_id: input.status_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    taskStore.addTask(newTask);
    return newTask;
  }

  async updateTask(taskId: string, updates: UpdateTaskInput): Promise<Task> {
    await this.delay();
    
    taskStore.updateTask(taskId, updates);
    const updated = taskStore.tasks.find(t => t.id === taskId);
    if (!updated) throw new Error(`Task ${taskId} not found`);
    return updated;
  }

  async deleteTask(taskId: string): Promise<void> {
    await this.delay();
    taskStore.deleteTask(taskId);
  }

  async bulkUpdateTasks(updates: BulkUpdateTaskInput[]): Promise<Task[]> {
    await this.delay();
    
    taskStore.bulkUpdateTasks(updates);
    return updates.map(({ id }) => {
      const task = taskStore.tasks.find(t => t.id === id);
      if (!task) throw new Error(`Task ${id} not found`);
      return task;
    });
  }

  // ==================== TASK LABELS ====================
  
  async getTaskLabels(projectId?: string): Promise<TaskLabel[]> {
    await this.delay();
    
    if (projectId) {
      return taskStore.labels.filter(l => l.project_id === null || l.project_id === projectId);
    }
    return taskStore.labels.filter(l => l.project_id === null);
  }

  async createTaskLabel(label: Omit<TaskLabel, 'id' | 'created_at'>): Promise<TaskLabel> {
    await this.delay();
    
    const newLabel: TaskLabel = {
      id: `label-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...label,
      created_at: new Date().toISOString()
    };

    taskStore.addLabel(newLabel);
    return newLabel;
  }

  async updateTaskLabel(labelId: string, updates: Partial<TaskLabel>): Promise<TaskLabel> {
    await this.delay();
    
    taskStore.updateLabel(labelId, updates);
    const updated = taskStore.labels.find(l => l.id === labelId);
    if (!updated) throw new Error(`Label ${labelId} not found`);
    return updated;
  }

  async deleteTaskLabel(labelId: string): Promise<void> {
    await this.delay();
    taskStore.deleteLabel(labelId);
  }

  // ==================== TASK STATUSES ====================
  
  async getTaskStatuses(projectId?: string): Promise<TaskStatus[]> {
    await this.delay();
    
    if (projectId) {
      return taskStore.statuses.filter(s => s.project_id === null || s.project_id === projectId);
    }
    return taskStore.statuses.filter(s => s.project_id === null);
  }

  async createTaskStatus(status: Omit<TaskStatus, 'id' | 'created_at'>): Promise<TaskStatus> {
    await this.delay();
    
    const newStatus: TaskStatus = {
      id: `status-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...status,
      created_at: new Date().toISOString()
    };

    taskStore.addStatus(newStatus);
    console.log('[Mock] Task status created', newStatus);
    return newStatus;
  }

  async updateTaskStatus(statusId: string, updates: Partial<TaskStatus>): Promise<TaskStatus> {
    await this.delay();
    
    taskStore.updateStatus(statusId, updates);
    const updated = taskStore.statuses.find(s => s.id === statusId);
    if (!updated) throw new Error(`Status ${statusId} not found`);
    return updated;
  }

  async deleteTaskStatus(statusId: string): Promise<void> {
    await this.delay();
    taskStore.deleteStatus(statusId);
  }
}

// Export singleton instance
export const taskMockService = new TaskMockService();
