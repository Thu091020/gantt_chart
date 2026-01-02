export interface Employee {
  id: string;
  code: string;
  name: string;
  position: string;
  email?: string;
  phone?: string;
  createdAt: Date;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'completed' | 'on-hold';
  color: string;
  members?: string[]; // Array of employee IDs
}

export interface Allocation {
  id: string;
  employeeId: string;
  projectId: string;
  date: string; // YYYY-MM-DD
  effort: number; // man-days (0-1, can be 0.5 for half day)
}

export interface Holiday {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  isRecurring: boolean;
}

export interface EmployeeStatus {
  employee: Employee;
  totalEffort: number;
  projects: Project[];
  status: 'available' | 'busy' | 'full';
}
