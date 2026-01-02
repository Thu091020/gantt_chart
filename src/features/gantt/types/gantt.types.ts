/**
 * Gantt chart UI and view-related types
 */

export type ViewMode = 'day' | 'week' | 'month' | 'quarter' | 'custom';

export type ZoomLevel = 'day' | 'week' | 'month';

export interface TaskBarLabels {
  showName: boolean;
  showAssignees: boolean;
  showDuration: boolean;
  showDates: boolean;
}

export interface ColumnSettings {
  id: string;
  width: number;
  visible: boolean;
  fixed?: boolean;
}

export interface CustomColumn {
  id: string;
  name: string;
  width: number;
  visible: boolean;
  fixed?: boolean;
}

export interface ViewSettings {
  effortSummary?: {
    startDate: string;
    endDate: string;
    viewMode?: string;
  };
  projectDetail?: {
    startDate: string;
    viewMode?: string;
    customStartDate?: string;
    customEndDate?: string;
  };
  taskBarLabels?: TaskBarLabels;
  expandedTaskIds?: { [projectId: string]: string[] };
  columnSettings?: ColumnSettings[];
}

export interface TimelineColumn {
  date: Date;
  label: string;
  subLabel: string;
  width: number;
  days: number;
  isAggregate?: boolean;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface GanttViewState {
  viewMode: ViewMode;
  zoomLevel: ZoomLevel;
  startDate: Date;
  endDate: Date;
  customStartDate?: Date;
  customEndDate?: Date;
  scrollPosition: number;
}

export interface GanttUIState {
  selectedTaskId: string | null;
  selectedTaskIds: Set<string>;
  expandedTaskIds: Set<string>;
  isTaskDialogOpen: boolean;
  isBaselineDialogOpen: boolean;
  isLabelSettingsOpen: boolean;
  isViewSettingsOpen: boolean;
  hoveredTaskId: string | null;
  isDragging: boolean;
}

export interface Baseline {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  snapshot: {
    tasks: any[];
    allocations: any[];
  };
  created_by: string | null;
  created_at: string;
}

export interface ProjectMilestone {
  id: string;
  project_id: string;
  name: string;
  date: string;
  color: string;
  description: string | null;
  created_at: string;
}
