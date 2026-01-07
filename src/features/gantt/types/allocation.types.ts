/**
 * Allocation-related types for resource management
 */

export interface Allocation {
  id: string;
  employee_id: string;
  project_id: string;
  date: string;
  effort: number;
  source: 'gantt' | 'manual';
  created_at: string;
}

export interface AllocationQueryParams {
  projectId?: string;
  employeeId?: string;
  startDate?: string; // yyyy-MM-dd
  endDate?: string;   // yyyy-MM-dd
}

export interface CreateAllocationInput {
  employee_id: string;
  project_id: string;
  date: string;
  effort: number;
  source?: 'gantt' | 'manual';
}

export interface UpdateAllocationInput {
  effort: number;
  source?: 'gantt' | 'manual';
}

export interface BulkAllocationInput {
  employeeId: string;
  projectId: string;
  date: string;
  effort: number;
  source?: 'gantt' | 'manual';
}

export type AllocationSource = 'gantt' | 'manual';