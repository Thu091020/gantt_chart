/**
 * Gantt Feature Constants
 * 
 * Centralized constants used throughout the gantt feature
 */

// View Modes
export const GANTT_VIEW_MODES = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
  QUARTER: 'quarter',
  CUSTOM: 'custom',
} as const;

export type GanttViewMode = typeof GANTT_VIEW_MODES[keyof typeof GANTT_VIEW_MODES];

// Zoom Levels
export const GANTT_ZOOM_LEVELS = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
} as const;

export type GanttZoomLevel = typeof GANTT_ZOOM_LEVELS[keyof typeof GANTT_ZOOM_LEVELS];

// Default Settings
export const DEFAULT_TASK_BAR_LABELS = {
  showName: true,
  showAssignees: false,
  showDuration: false,
  showDates: false,
} as const;

export const DEFAULT_COLUMNS = [
  { id: 'task_id', name: 'ID', width: 40, visible: true, fixed: true },
  { id: 'wbs', name: 'WBS', width: 65, visible: true, fixed: true },
  { id: 'name', name: 'Tên task', width: 180, visible: true, fixed: true },
  { id: 'status', name: 'Trạng thái', width: 95, visible: true },
  { id: 'start_date', name: 'Bắt đầu', width: 85, visible: true },
  { id: 'end_date', name: 'Kết thúc', width: 85, visible: true },
  { id: 'duration', name: 'Duration', width: 65, visible: true },
  { id: 'predecessors', name: 'Predec', width: 60, visible: true },
  { id: 'assignees', name: 'Assign', width: 100, visible: true },
  { id: 'effort', name: 'Effort', width: 55, visible: true },
  { id: 'progress', name: 'Tiến độ', width: 70, visible: true },
  { id: 'label', name: 'Label', width: 85, visible: true },
] as const;

// Timeline
export const GANTT_TIMELINE_DEFAULTS = {
  columnWidth: 80,
  headerHeight: 80,
  rowHeight: 40,
  marginLeft: 300,
} as const;

// Colors
export const GANTT_COLORS = {
  taskBar: '#3B82F6',
  baseline: '#9CA3AF',
  milestone: '#8B5CF6',
  holiday: '#FCA5A5',
  weekend: '#F3F4F6',
  critical: '#EF4444',
  onTrack: '#10B981',
  delayed: '#F59E0B',
  completed: '#6B7280',
} as const;

// Status Types
export const DEFAULT_STATUS_COLORS = {
  'Not Started': '#6B7280',
  'In Progress': '#3B82F6',
  'On Hold': '#F59E0B',
  'Completed': '#10B981',
  'Cancelled': '#EF4444',
} as const;

// Label Colors
export const DEFAULT_LABEL_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#6B7280', // Gray
] as const;

// API Delays (for mock services)
export const API_DELAYS = {
  SHORT: 300,
  NORMAL: 500,
  LONG: 1000,
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  GANTT_VIEW_SETTINGS: 'gantt_view_settings',
  GANTT_COLUMN_SETTINGS: 'gantt_column_settings',
  GANTT_USER_PREFERENCES: 'gantt_user_preferences',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  FAILED_TO_LOAD_TASKS: 'Không thể tải danh sách task',
  FAILED_TO_UPDATE_TASK: 'Không thể cập nhật task',
  FAILED_TO_CREATE_TASK: 'Không thể tạo task mới',
  FAILED_TO_DELETE_TASK: 'Không thể xóa task',
  FAILED_TO_LOAD_ALLOCATIONS: 'Không thể tải allocation',
  INVALID_DATE_RANGE: 'Ngày không hợp lệ',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  TASK_CREATED: 'Task mới đã được tạo',
  TASK_UPDATED: 'Task đã được cập nhật',
  TASK_DELETED: 'Task đã được xóa',
  ALLOCATION_SAVED: 'Allocation đã được lưu',
} as const;
