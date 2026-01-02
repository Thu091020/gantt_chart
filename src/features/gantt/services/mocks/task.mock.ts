/**
 * Task Mock Service
 * Returns fake data for development/testing
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
import { mockTasks, mockTaskLabels, mockTaskStatuses } from './data/mock-tasks';

const MOCK_DELAY = 300; // Simulate network delay

export class TaskMockService implements ITaskService {
  private tasks: Task[] = [...mockTasks];
  private labels: TaskLabel[] = [...mockTaskLabels];
  private statuses: TaskStatus[] = [...mockTaskStatuses];

  private delay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
  }

  // ==================== TASKS ====================
  
  async getTasks(projectId: string): Promise<Task[]> {
    await this.delay();
    return this.tasks.filter(t => t.project_id === projectId);
  }

  async getTaskById(taskId: string): Promise<Task> {
    await this.delay();
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);
    return task;
  }

  async createTask(input: CreateTaskInput): Promise<Task> {
    await this.delay();
    
    const newTask: Task = {
      id: `task-${Date.now()}`,
      ...input,
      parent_id: input.parent_id || null,
      start_date: input.start_date || null,
      end_date: input.end_date || null,
      duration: input.duration || 1,
      progress: input.progress || 0,
      predecessors: input.predecessors || [],
      assignees: input.assignees || [],
      effort_per_assignee: input.effort_per_assignee || 1,
      sort_order: input.sort_order || this.tasks.length,
      is_milestone: input.is_milestone || false,
      notes: input.notes || null,
      text_style: input.text_style || null,
      label_id: input.label_id || null,
      status_id: input.status_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.tasks.push(newTask);
    return newTask;
  }

  async updateTask(taskId: string, updates: UpdateTaskInput): Promise<Task> {
    await this.delay();
    
    const index = this.tasks.findIndex(t => t.id === taskId);
    if (index === -1) throw new Error(`Task ${taskId} not found`);

    this.tasks[index] = {
      ...this.tasks[index],
      ...updates,
      updated_at: new Date().toISOString()
    };

    return this.tasks[index];
  }

  async deleteTask(taskId: string): Promise<void> {
    await this.delay();
    
    this.tasks = this.tasks.filter(t => t.id !== taskId);
  }

  async bulkUpdateTasks(updates: BulkUpdateTaskInput[]): Promise<Task[]> {
    await this.delay();
    
    const results: Task[] = [];
    
    for (const { id, updates: taskUpdates } of updates) {
      const updated = await this.updateTask(id, taskUpdates);
      results.push(updated);
    }
    
    return results;
  }

  // ==================== TASK LABELS ====================
  
  async getTaskLabels(projectId?: string): Promise<TaskLabel[]> {
    await this.delay();
    
    if (projectId) {
      return this.labels.filter(l => l.project_id === null || l.project_id === projectId);
    }
    return this.labels.filter(l => l.project_id === null);
  }

  async createTaskLabel(label: Omit<TaskLabel, 'id' | 'created_at'>): Promise<TaskLabel> {
    await this.delay();
    
    const newLabel: TaskLabel = {
      id: `label-${Date.now()}`,
      ...label,
      created_at: new Date().toISOString()
    };

    this.labels.push(newLabel);
    return newLabel;
  }

  async updateTaskLabel(labelId: string, updates: Partial<TaskLabel>): Promise<TaskLabel> {
    await this.delay();
    
    const index = this.labels.findIndex(l => l.id === labelId);
    if (index === -1) throw new Error(`Label ${labelId} not found`);

    this.labels[index] = {
      ...this.labels[index],
      ...updates
    };

    return this.labels[index];
  }

  async deleteTaskLabel(labelId: string): Promise<void> {
    await this.delay();
    
    this.labels = this.labels.filter(l => l.id !== labelId);
  }

  // ==================== TASK STATUSES ====================
  
  async getTaskStatuses(projectId?: string): Promise<TaskStatus[]> {
    await this.delay();
    
    if (projectId) {
      return this.statuses.filter(s => s.project_id === null || s.project_id === projectId);
    }
    return this.statuses.filter(s => s.project_id === null);
  }

  async createTaskStatus(status: Omit<TaskStatus, 'id' | 'created_at'>): Promise<TaskStatus> {
    await this.delay();
    
    const newStatus: TaskStatus = {
      id: `status-${Date.now()}`,
      ...status,
      created_at: new Date().toISOString()
    };

    this.statuses.push(newStatus);
    return newStatus;
  }

  async updateTaskStatus(statusId: string, updates: Partial<TaskStatus>): Promise<TaskStatus> {
    await this.delay();
    
    const index = this.statuses.findIndex(s => s.id === statusId);
    if (index === -1) throw new Error(`Status ${statusId} not found`);

    this.statuses[index] = {
      ...this.statuses[index],
      ...updates
    };

    return this.statuses[index];
  }

  async deleteTaskStatus(statusId: string): Promise<void> {
    await this.delay();
    
    this.statuses = this.statuses.filter(s => s.id !== statusId);
  }
}

// Export singleton instance
export const taskMockService = new TaskMockService();
