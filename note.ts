/**
 * Task-related types for Gantt chart feature
 */

// Định nghĩa các types liên kết
export type DependencyType = 'FS' | 'SS' | 'FF' | 'SF';
export interface Predecessor {
  id: string; // ID của task tiền nhiệm
  type: DependencyType; // Mặc định là 'FS'
  lag: string; // Ví dụ: "4d", "-2d", "1w+2d", "4d+1m"
}
export interface Task {
  id: string;
  project_id: string;
  parent_id: string | null;
  name: string;
  start_date: string | null;
  end_date: string | null;
  duration: number;
  progress: number;
  predecessors: Predecessor[];
  assignees: string[]; // cho nhà thầu đó
  effort_per_assignee: number;
  sort_order: number;
  is_milestone: boolean;
  notes: string | null;
  text_style: string | null; // 'bold', 'italic', 'bold-italic' or null
  label_id: string | null; // Reference to task_labels table
  status_id?: string | null; // Reference to task_statuses table
  created_at: string;
  updated_at: string;

  // Computed fields for UI
  children?: Task[];
  level?: number;
  isExpanded?: boolean;
}

export interface TaskLabel {
  id: string;
  project_id: string | null;
  name: string;
  color: string;
  sort_order: number;
  is_default: boolean;
  created_at: string;
}

export interface TaskStatus {
  id: string;
  project_id: string | null;
  name: string;
  color: string;
  sort_order: number;
  is_default: boolean;
  created_at: string;
}

export interface CreateTaskInput {
  project_id: string;
  parent_id?: string | null;
  name: string;
  start_date?: string | null;
  end_date?: string | null;
  duration?: number;
  progress?: number;
  predecessors?: string[];
  assignees?: string[];
  effort_per_assignee?: number;
  sort_order?: number;
  is_milestone?: boolean;
  notes?: string | null;
  text_style?: string | null;
  label_id?: string | null;
  status_id?: string | null;
}

export interface UpdateTaskInput {
  name?: string;
  start_date?: string | null;
  end_date?: string | null;
  duration?: number;
  progress?: number;
  predecessors?: string[];
  assignees?: string[];
  effort_per_assignee?: number;
  sort_order?: number;
  is_milestone?: boolean;
  notes?: string | null;
  text_style?: string | null;
  label_id?: string | null;
  status_id?: string | null;
  parent_id?: string | null;
}

export interface BulkUpdateTaskInput {
  id: string;
  updates: UpdateTaskInput;
}

export type TextStyle = 'bold' | 'italic' | 'bold-italic' | null;
