/**
 * Task Service Interface - Contract for all task operations
 */

import type { 
  Task, 
  CreateTaskInput, 
  UpdateTaskInput, 
  BulkUpdateTaskInput,
  TaskLabel,
  TaskStatus 
} from '../../types/task.types';

export interface ITaskService {
  // Task CRUD operations
  getTasks(projectId: string): Promise<Task[]>;
  getTaskById(taskId: string): Promise<Task>;
  createTask(input: CreateTaskInput): Promise<Task>;
  updateTask(taskId: string, updates: UpdateTaskInput): Promise<Task>;
  deleteTask(taskId: string): Promise<void>;
  bulkUpdateTasks(updates: BulkUpdateTaskInput[]): Promise<Task[]>;
  
  // Task Labels
  getTaskLabels(projectId?: string): Promise<TaskLabel[]>;
  createTaskLabel(label: Omit<TaskLabel, 'id' | 'created_at'>): Promise<TaskLabel>;
  updateTaskLabel(labelId: string, updates: Partial<TaskLabel>): Promise<TaskLabel>;
  deleteTaskLabel(labelId: string): Promise<void>;
  
  // Task Statuses
  getTaskStatuses(projectId?: string): Promise<TaskStatus[]>;
  createTaskStatus(status: Omit<TaskStatus, 'id' | 'created_at'>): Promise<TaskStatus>;
  updateTaskStatus(statusId: string, updates: Partial<TaskStatus>): Promise<TaskStatus>;
  deleteTaskStatus(statusId: string): Promise<void>;
}
