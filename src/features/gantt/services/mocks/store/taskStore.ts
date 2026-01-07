/**
 * Task Mock Store
 * Quản lý tasks, labels, và statuses state cho mock services
 * Hỗ trợ CRUD operations và subscription pattern
 */

import type { Task, TaskLabel, TaskStatus } from '../../../types/task.types';
import { mockTasks, mockTaskLabels, mockTaskStatuses } from '../data/mock-tasks';

interface TaskStoreState {
  // Data
  tasks: Task[];
  labels: TaskLabel[];
  statuses: TaskStatus[];
  
  // Task Actions
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  bulkUpdateTasks: (updates: Array<{ id: string; updates: Partial<Task> }>) => void;
  
  // Label Actions
  setLabels: (labels: TaskLabel[]) => void;
  addLabel: (label: TaskLabel) => void;
  updateLabel: (labelId: string, updates: Partial<TaskLabel>) => void;
  deleteLabel: (labelId: string) => void;
  
  // Status Actions
  setStatuses: (statuses: TaskStatus[]) => void;
  addStatus: (status: TaskStatus) => void;
  updateStatus: (statusId: string, updates: Partial<TaskStatus>) => void;
  deleteStatus: (statusId: string) => void;
  
  // Utility
  reset: () => void;
  getState: () => TaskStoreState;
  subscribe: (listener: () => void) => () => void;
}

class TaskStore implements TaskStoreState {
  tasks: Task[] = [...mockTasks];
  labels: TaskLabel[] = [...mockTaskLabels];
  statuses: TaskStatus[] = [...mockTaskStatuses];

  // Listeners for state changes
  private listeners: Set<() => void> = new Set();

  /**
   * Subscribe to store changes
   * @param listener Callback function to call when store changes
   * @returns Unsubscribe function
   */
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /**
   * Notify all listeners of state changes
   */
  private notify() {
    this.listeners.forEach(listener => listener());
  }

  // ==================== TASK ACTIONS ====================
  
  /**
   * Set all tasks (replace entire array)
   */
  setTasks = (tasks: Task[]) => {
    this.tasks = [...tasks];
    this.notify();
  };

  /**
   * Add a new task
   */
  addTask = (task: Task) => {
    this.tasks.push(task);
    this.notify();
  };

  /**
   * Update an existing task
   */
  updateTask = (taskId: string, updates: Partial<Task>) => {
    const index = this.tasks.findIndex(t => t.id === taskId);
    if (index === -1) {
      throw new Error(`Task ${taskId} not found`);
    }
    this.tasks[index] = {
      ...this.tasks[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.notify();
  };

  /**
   * Delete a task
   */
  deleteTask = (taskId: string) => {
    this.tasks = this.tasks.filter(t => t.id !== taskId);
    this.notify();
  };

  /**
   * Bulk update multiple tasks
   */
  bulkUpdateTasks = (updates: Array<{ id: string; updates: Partial<Task> }>) => {
    updates.forEach(({ id, updates: taskUpdates }) => {
      this.updateTask(id, taskUpdates);
    });
    // Only notify once after all updates
    this.notify();
  };

  // ==================== LABEL ACTIONS ====================
  
  /**
   * Set all labels (replace entire array)
   */
  setLabels = (labels: TaskLabel[]) => {
    this.labels = [...labels];
    this.notify();
  };

  /**
   * Add a new label
   */
  addLabel = (label: TaskLabel) => {
    this.labels.push(label);
    this.notify();
  };

  /**
   * Update an existing label
   */
  updateLabel = (labelId: string, updates: Partial<TaskLabel>) => {
    const index = this.labels.findIndex(l => l.id === labelId);
    if (index === -1) {
      throw new Error(`Label ${labelId} not found`);
    }
    this.labels[index] = {
      ...this.labels[index],
      ...updates
    };
    this.notify();
  };

  /**
   * Delete a label
   */
  deleteLabel = (labelId: string) => {
    this.labels = this.labels.filter(l => l.id !== labelId);
    this.notify();
  };

  // ==================== STATUS ACTIONS ====================
  
  /**
   * Set all statuses (replace entire array)
   */
  setStatuses = (statuses: TaskStatus[]) => {
    this.statuses = [...statuses];
    this.notify();
  };

  /**
   * Add a new status
   */
  addStatus = (status: TaskStatus) => {
    this.statuses.push(status);
    this.notify();
  };

  /**
   * Update an existing status
   */
  updateStatus = (statusId: string, updates: Partial<TaskStatus>) => {
    const index = this.statuses.findIndex(s => s.id === statusId);
    if (index === -1) {
      throw new Error(`Status ${statusId} not found`);
    }
    this.statuses[index] = {
      ...this.statuses[index],
      ...updates
    };
    this.notify();
  };

  /**
   * Delete a status
   */
  deleteStatus = (statusId: string) => {
    this.statuses = this.statuses.filter(s => s.id !== statusId);
    this.notify();
  };

  // ==================== UTILITY ====================
  
  /**
   * Reset store to initial mock data
   */
  reset = () => {
    this.tasks = [...mockTasks];
    this.labels = [...mockTaskLabels];
    this.statuses = [...mockTaskStatuses];
    this.notify();
  };

  /**
   * Get current store state
   */
  getState = (): TaskStoreState => ({
    tasks: this.tasks,
    labels: this.labels,
    statuses: this.statuses,
    setTasks: this.setTasks,
    addTask: this.addTask,
    updateTask: this.updateTask,
    deleteTask: this.deleteTask,
    bulkUpdateTasks: this.bulkUpdateTasks,
    setLabels: this.setLabels,
    addLabel: this.addLabel,
    updateLabel: this.updateLabel,
    deleteLabel: this.deleteLabel,
    setStatuses: this.setStatuses,
    addStatus: this.addStatus,
    updateStatus: this.updateStatus,
    deleteStatus: this.deleteStatus,
    reset: this.reset,
    getState: this.getState,
    subscribe: this.subscribe
  });
}

// Export singleton instance
export const taskStore = new TaskStore();

