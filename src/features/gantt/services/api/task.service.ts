/**
 * Task Service - Supabase Implementation
 * Handles all task-related database operations
 */

import { supabase } from '@/integrations/supabase/client';
import type { ITaskService } from '../interfaces/task.interface';
import type { 
  Task, 
  CreateTaskInput, 
  UpdateTaskInput, 
  BulkUpdateTaskInput,
  TaskLabel,
  TaskStatus 
} from '../../types/task.types';

export class TaskService implements ITaskService {
  // ==================== TASKS ====================
  
  async getTasks(projectId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true });
    
    if (error) throw error;
    return data as Task[];
  }

  async getTaskById(taskId: string): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();
    
    if (error) throw error;
    return data as Task;
  }

  async createTask(input: CreateTaskInput): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .insert(input)
      .select()
      .single();
    
    if (error) throw error;
    return data as Task;
  }

  async updateTask(taskId: string, updates: UpdateTaskInput): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();
    
    if (error) throw error;
    return data as Task;
  }

  async deleteTask(taskId: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);
    
    if (error) throw error;
  }

  async bulkUpdateTasks(updates: BulkUpdateTaskInput[]): Promise<Task[]> {
    const results: Task[] = [];
    
    // Execute updates in parallel
    const promises = updates.map(({ id, updates: taskUpdates }) =>
      this.updateTask(id, taskUpdates)
    );
    
    const updatedTasks = await Promise.all(promises);
    results.push(...updatedTasks);
    
    return results;
  }

  // ==================== TASK LABELS ====================
  
  async getTaskLabels(projectId?: string): Promise<TaskLabel[]> {
    let query = supabase
      .from('task_labels')
      .select('*');
    
    if (projectId) {
      query = query.or(`project_id.is.null,project_id.eq.${projectId}`);
    } else {
      query = query.is('project_id', null);
    }
    
    const { data, error } = await query.order('sort_order', { ascending: true });
    
    if (error) throw error;
    return data as TaskLabel[];
  }

  async createTaskLabel(label: Omit<TaskLabel, 'id' | 'created_at'>): Promise<TaskLabel> {
    const { data, error } = await supabase
      .from('task_labels')
      .insert(label)
      .select()
      .single();
    
    if (error) throw error;
    return data as TaskLabel;
  }

  async updateTaskLabel(labelId: string, updates: Partial<TaskLabel>): Promise<TaskLabel> {
    const { data, error } = await supabase
      .from('task_labels')
      .update(updates)
      .eq('id', labelId)
      .select()
      .single();
    
    if (error) throw error;
    return data as TaskLabel;
  }

  async deleteTaskLabel(labelId: string): Promise<void> {
    const { error } = await supabase
      .from('task_labels')
      .delete()
      .eq('id', labelId);
    
    if (error) throw error;
  }

  // ==================== TASK STATUSES ====================
  
  async getTaskStatuses(projectId?: string): Promise<TaskStatus[]> {
    let query = supabase
      .from('task_statuses')
      .select('*');
    
    if (projectId) {
      query = query.or(`project_id.is.null,project_id.eq.${projectId}`);
    } else {
      query = query.is('project_id', null);
    }
    
    const { data, error } = await query.order('sort_order', { ascending: true });
    
    if (error) throw error;
    return data as TaskStatus[];
  }

  async createTaskStatus(status: Omit<TaskStatus, 'id' | 'created_at'>): Promise<TaskStatus> {
    const { data, error } = await supabase
      .from('task_statuses')
      .insert(status)
      .select()
      .single();
    
    if (error) throw error;
    return data as TaskStatus;
  }

  async updateTaskStatus(statusId: string, updates: Partial<TaskStatus>): Promise<TaskStatus> {
    const { data, error } = await supabase
      .from('task_statuses')
      .update(updates)
      .eq('id', statusId)
      .select()
      .single();
    
    if (error) throw error;
    return data as TaskStatus;
  }

  async deleteTaskStatus(statusId: string): Promise<void> {
    const { error } = await supabase
      .from('task_statuses')
      .delete()
      .eq('id', statusId);
    
    if (error) throw error;
  }
}

// Export singleton instance
export const taskService = new TaskService();
