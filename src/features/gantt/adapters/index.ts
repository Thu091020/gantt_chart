/**
 * Adapters - External Dependencies Interfaces
 *
 * This file defines interfaces for external dependencies that the Gantt feature needs.
 * When integrating into a new project, you need to provide implementations for these interfaces.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ==================== Database Adapter ====================
export interface IGanttDatabaseAdapter {
  supabaseClient: SupabaseClient;
}

// ==================== UI Component Adapters ====================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface IGanttUIComponents {
  // Basic UI
  Button: React.ComponentType<any>;
  Input: React.ComponentType<any>;
  Label: React.ComponentType<any>;
  Checkbox: React.ComponentType<any>;
  Separator: React.ComponentType<any>;

  // Dialogs & Popovers
  Dialog: React.ComponentType<any>;
  DialogContent: React.ComponentType<any>;
  DialogHeader: React.ComponentType<any>;
  DialogTitle: React.ComponentType<any>;
  DialogFooter: React.ComponentType<any>;
  DialogTrigger: React.ComponentType<any>;

  AlertDialog: React.ComponentType<any>;
  AlertDialogAction: React.ComponentType<any>;
  AlertDialogCancel: React.ComponentType<any>;
  AlertDialogContent: React.ComponentType<any>;
  AlertDialogDescription: React.ComponentType<any>;
  AlertDialogFooter: React.ComponentType<any>;
  AlertDialogHeader: React.ComponentType<any>;
  AlertDialogTitle: React.ComponentType<any>;
  AlertDialogTrigger: React.ComponentType<any>;

  Popover: React.ComponentType<any>;
  PopoverContent: React.ComponentType<any>;
  PopoverTrigger: React.ComponentType<any>;

  // Select
  Select: React.ComponentType<any>;
  SelectContent: React.ComponentType<any>;
  SelectItem: React.ComponentType<any>;
  SelectTrigger: React.ComponentType<any>;
  SelectValue: React.ComponentType<any>;

  // Calendar & Date
  Calendar: React.ComponentType<any>;

  // Tooltip
  Tooltip: React.ComponentType<any>;
  TooltipContent: React.ComponentType<any>;
  TooltipProvider: React.ComponentType<any>;
  TooltipTrigger: React.ComponentType<any>;

  // Textarea
  Textarea: React.ComponentType<any>;

  // ScrollArea
  ScrollArea: React.ComponentType<any>;

  // Resizable
  ResizablePanelGroup: React.ComponentType<any>;
  ResizablePanel: React.ComponentType<any>;
  ResizableHandle: React.ComponentType<any>;
}

// ==================== Utility Adapters ====================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface IGanttUtilityFunctions {
  // cn function for className merging (typically from clsx + tailwind-merge)
  cn: (...inputs: any[]) => string;

  // Toast notifications
  toast: {
    (message: string, options?: any): void;
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
    warning: (message: string) => void;
  };
}

// ==================== Auth Adapter ====================
export interface IGanttAuthAdapter {
  user: {
    id: string;
    email?: string;
    name?: string;
  } | null;
  isLoading: boolean;
}

// ==================== Data Hooks Adapters ====================

// Employee/User
export interface IEmployee {
  id: string;
  name: string;
  email?: string;
  avatar_url?: string;
}

export interface IEmployeesAdapter {
  employees: IEmployee[];
  isLoading: boolean;
  error: Error | null;
}

// Task Status
export interface ITaskStatus {
  id: string;
  name: string;
  color: string;
  order: number;
  project_id: string;
}

export interface ITaskStatusAdapter {
  statuses: ITaskStatus[];
  isLoading: boolean;
  addStatus: (status: Omit<ITaskStatus, 'id'>) => Promise<void>;
  updateStatus: (id: string, updates: Partial<ITaskStatus>) => Promise<void>;
  deleteStatus: (id: string) => Promise<void>;
}

// Task Label
export interface ITaskLabel {
  id: string;
  name: string;
  color: string;
  project_id: string;
}

export interface ITaskLabelAdapter {
  labels: ITaskLabel[];
  isLoading: boolean;
  addLabel: (label: Omit<ITaskLabel, 'id'>) => Promise<void>;
  updateLabel: (id: string, updates: Partial<ITaskLabel>) => Promise<void>;
  deleteLabel: (id: string) => Promise<void>;
}

// Project Milestone
export interface IProjectMilestone {
  id: string;
  project_id: string;
  name: string;
  date: string;
  description?: string;
  color?: string;
}

export interface IMilestoneAdapter {
  milestones: IProjectMilestone[];
  isLoading: boolean;
  addMilestone: (milestone: Omit<IProjectMilestone, 'id'>) => Promise<void>;
  updateMilestone: (
    id: string,
    updates: Partial<IProjectMilestone>
  ) => Promise<void>;
  deleteMilestone: (id: string) => Promise<void>;
}

// Holiday
export interface IHoliday {
  id: string;
  date: string;
  end_date: string | null;
  name: string;
  is_recurring: boolean;
}

export interface IHolidayAdapter {
  holidays: IHoliday[];
  isLoading: boolean;
}

// Baseline
export interface IBaseline {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  created_at: string;
  created_by: string;
}

export interface IBaselineAdapter {
  baselines: IBaseline[];
  isLoading: boolean;
  addBaseline: (
    baseline: Omit<IBaseline, 'id' | 'created_at'>
  ) => Promise<void>;
  deleteBaseline: (id: string) => Promise<void>;
  restoreBaseline: (id: string) => Promise<void>;
}

// View Settings
export interface ITaskBarLabels {
  show_task_name: boolean;
  show_assignees: boolean;
  show_progress: boolean;
  show_dates: boolean;
}

export interface IViewSettings {
  id?: string;
  project_id: string;
  user_id: string;
  settings: {
    task_bar_labels?: ITaskBarLabels;
    columns?: any[];
    [key: string]: any;
  };
}

export interface IViewSettingsAdapter {
  viewSettings: IViewSettings | null;
  isLoading: boolean;
  saveViewSettings: (settings: Partial<IViewSettings>) => Promise<void>;
}

// Collaboration
export interface ICollaborationAdapter {
  CollaborationOverlay?: React.ComponentType<any>;
  CollaborationAvatars?: React.ComponentType<any>;
}

// ==================== Main Config Interface ====================
export interface IGanttConfig {
  database: IGanttDatabaseAdapter;
  ui: IGanttUIComponents;
  utils: IGanttUtilityFunctions;
  auth: IGanttAuthAdapter;

  // Data adapters (optional - if not provided, will use internal implementations)
  employees?: IEmployeesAdapter;
  taskStatus?: ITaskStatusAdapter;
  taskLabels?: ITaskLabelAdapter;
  milestones?: IMilestoneAdapter;
  holidays?: IHolidayAdapter;
  baselines?: IBaselineAdapter;
  viewSettings?: IViewSettingsAdapter;
  collaboration?: ICollaborationAdapter;
}

// ==================== Config Store ====================
let ganttConfig: IGanttConfig | null = null;

export function configureGantt(config: IGanttConfig) {
  ganttConfig = config;
}

export function getGanttConfig(): IGanttConfig {
  if (!ganttConfig) {
    throw new Error(
      'Gantt feature is not configured. Please call configureGantt() before using the Gantt feature.'
    );
  }
  return ganttConfig;
}

export function isGanttConfigured(): boolean {
  return ganttConfig !== null;
}

// Export adapter creators and utilities for integration
export { createMockDatabaseAdapter } from './mockDatabase';
export { createRealDatabaseAdapter } from './realDatabase';
export {
  createDatabaseAdapter,
  setGanttAdapterMode,
  getGanttAdapterMode,
  uiAdapter,
  utilsAdapter,
  type GanttAdapterMode,
} from './config';
