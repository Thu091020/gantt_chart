/**
 * Gantt Chart Design Tokens - Colors
 * 
 * Completely self-contained color definitions for Gantt feature
 * Supports both light and dark modes
 * 
 * No external dependencies - can be copied to any project
 */

// Detect if we're in dark mode
const isDarkMode = () => {
  if (typeof window === 'undefined') return false;
  return (
    document.documentElement.classList.contains('dark') ||
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
};

// ============================================================================
// LIGHT MODE COLORS
// ============================================================================
export const LIGHT_COLORS = {
  // Background Colors
  background: '#ffffff',
  surfacePrimary: '#f8fafc',
  surfaceSecondary: '#f1f5f9',
  surfaceTertiary: '#e2e8f0',
  
  // Text Colors
  textPrimary: '#1e293b',
  textSecondary: '#64748b',
  textTertiary: '#94a3b8',
  textMuted: '#cbd5e1',
  
  // Border Colors
  borderPrimary: '#e2e8f0',
  borderSecondary: '#cbd5e1',
  borderLight: '#f1f5f9',
  
  // Status Colors
  statusSuccess: '#10b981',
  statusWarning: '#f59e0b',
  statusError: '#ef4444',
  statusInfo: '#3b82f6',
  statusTodo: '#6b7280',
  statusInProgress: '#06b6d4',
  statusDone: '#10b981',
  statusBlocked: '#ef4444',
  
  // Task Bar Colors
  taskBarBackground: '#dbeafe',
  taskBarBorder: '#3b82f6',
  taskBarHover: '#bfdbfe',
  taskBarSelected: '#1e40af',
  taskBarProgress: '#3b82f6',
  
  // Timeline Colors
  timelineGrid: '#e2e8f0',
  timelineHeader: '#f1f5f9',
  timelineToday: '#fef08a',
  timelineTodayMarker: '#ef4444',
  
  // Non-working Days
  nonWorkingDay: '#f1f5f9',
  holiday: '#fed7aa',
  weekend: '#f3f4f6',
  
  // Dependency & Milestone
  dependencyLine: '#8b5cf6',
  dependencyLineHover: '#7c3aed',
  milestoneDiamond: '#ec4899',
  milestoneBackground: '#fce7f3',
  
  // Selection & Focus
  selectionBackground: '#dbeafe',
  selectionBorder: '#3b82f6',
  focusRing: '#3b82f6',
  
  // Allocation Colors
  allocationManual: '#fbbf24',
  allocationAuto: '#86efac',
  allocationOverload: '#fca5a5',
  
  // Text Styling
  textBold: '#1e293b',
  textItalic: '#475569',
  
  // Scroll & Resize
  scrollBar: '#cbd5e1',
  scrollBarHover: '#94a3b8',
  resizeHandle: '#3b82f6',
} as const;

// ============================================================================
// DARK MODE COLORS
// ============================================================================
export const DARK_COLORS = {
  // Background Colors
  background: '#0f172a',
  surfacePrimary: '#1e293b',
  surfaceSecondary: '#334155',
  surfaceTertiary: '#475569',
  
  // Text Colors
  textPrimary: '#f1f5f9',
  textSecondary: '#cbd5e1',
  textTertiary: '#94a3b8',
  textMuted: '#64748b',
  
  // Border Colors
  borderPrimary: '#334155',
  borderSecondary: '#475569',
  borderLight: '#1e293b',
  
  // Status Colors
  statusSuccess: '#34d399',
  statusWarning: '#fbbf24',
  statusError: '#f87171',
  statusInfo: '#60a5fa',
  statusTodo: '#9ca3af',
  statusInProgress: '#22d3ee',
  statusDone: '#34d399',
  statusBlocked: '#f87171',
  
  // Task Bar Colors
  taskBarBackground: '#1e3a8a',
  taskBarBorder: '#60a5fa',
  taskBarHover: '#3b82f6',
  taskBarSelected: '#93c5fd',
  taskBarProgress: '#60a5fa',
  
  // Timeline Colors
  timelineGrid: '#334155',
  timelineHeader: '#1e293b',
  timelineToday: '#713f12',
  timelineTodayMarker: '#f87171',
  
  // Non-working Days
  nonWorkingDay: '#1e293b',
  holiday: '#92400e',
  weekend: '#0f172a',
  
  // Dependency & Milestone
  dependencyLine: '#a78bfa',
  dependencyLineHover: '#c4b5fd',
  milestoneDiamond: '#f472b6',
  milestoneBackground: '#500724',
  
  // Selection & Focus
  selectionBackground: '#1e3a8a',
  selectionBorder: '#60a5fa',
  focusRing: '#60a5fa',
  
  // Allocation Colors
  allocationManual: '#d97706',
  allocationAuto: '#4ade80',
  allocationOverload: '#fb7185',
  
  // Text Styling
  textBold: '#f1f5f9',
  textItalic: '#cbd5e1',
  
  // Scroll & Resize
  scrollBar: '#475569',
  scrollBarHover: '#64748b',
  resizeHandle: '#60a5fa',
} as const;

// ============================================================================
// EXPORT COLORS BY MODE
// ============================================================================
export const getGanttColors = () => {
  return isDarkMode() ? DARK_COLORS : LIGHT_COLORS;
};

export const getGanttColor = (key: keyof typeof LIGHT_COLORS): string => {
  const colors = isDarkMode() ? DARK_COLORS : LIGHT_COLORS;
  return colors[key];
};

// ============================================================================
// STATUS BADGE COLORS
// ============================================================================
export const STATUS_COLORS = {
  light: {
    todo: { bg: '#fef3c7', text: '#92400e', border: '#fbbf24' },
    inProgress: { bg: '#cffafe', text: '#164e63', border: '#22d3ee' },
    done: { bg: '#dcfce7', text: '#14532d', border: '#86efac' },
    blocked: { bg: '#fee2e2', text: '#7c2d12', border: '#fca5a5' },
  },
  dark: {
    todo: { bg: '#713f12', text: '#fbbf24', border: '#d97706' },
    inProgress: { bg: '#164e63', text: '#22d3ee', border: '#06b6d4' },
    done: { bg: '#14532d', text: '#86efac', border: '#10b981' },
    blocked: { bg: '#7c2d12', text: '#fca5a5', border: '#dc2626' },
  },
} as const;

export const getStatusColors = (status: 'todo' | 'inProgress' | 'done' | 'blocked') => {
  const mode = isDarkMode() ? 'dark' : 'light';
  return STATUS_COLORS[mode][status];
};

// ============================================================================
// TAILWIND COLOR MAPPING (For CSS classes)
// ============================================================================
export const TAILWIND_COLORS = {
  light: {
    bg: 'bg-white',
    surfacePrimary: 'bg-slate-50',
    surfaceSecondary: 'bg-slate-100',
    surfaceTertiary: 'bg-slate-200',
    textPrimary: 'text-slate-900',
    textSecondary: 'text-slate-600',
    textTertiary: 'text-slate-500',
    borderPrimary: 'border-slate-200',
    borderSecondary: 'border-slate-300',
  },
  dark: {
    bg: 'bg-slate-900',
    surfacePrimary: 'bg-slate-800',
    surfaceSecondary: 'bg-slate-700',
    surfaceTertiary: 'bg-slate-600',
    textPrimary: 'text-slate-100',
    textSecondary: 'text-slate-300',
    textTertiary: 'text-slate-400',
    borderPrimary: 'border-slate-700',
    borderSecondary: 'border-slate-600',
  },
} as const;

export const getTailwindClasses = () => {
  return isDarkMode() ? TAILWIND_COLORS.dark : TAILWIND_COLORS.light;
};

// ============================================================================
// THEME PROVIDER HOOK (For components)
// ============================================================================
export const useGanttTheme = () => {
  const colors = getGanttColors();
  const tailwind = getTailwindClasses();
  
  return {
    colors,
    tailwind,
    isDark: isDarkMode(),
    getStatusColor: getStatusColors,
  };
};

// ============================================================================
// CSS VARIABLES (For global CSS)
// ============================================================================
export const generateCSSVariables = (isDark: boolean = false) => {
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;
  
  return `
    :root {
      /* Background Colors */
      --gantt-bg: ${colors.background};
      --gantt-surface-primary: ${colors.surfacePrimary};
      --gantt-surface-secondary: ${colors.surfaceSecondary};
      --gantt-surface-tertiary: ${colors.surfaceTertiary};
      
      /* Text Colors */
      --gantt-text-primary: ${colors.textPrimary};
      --gantt-text-secondary: ${colors.textSecondary};
      --gantt-text-tertiary: ${colors.textTertiary};
      --gantt-text-muted: ${colors.textMuted};
      
      /* Border Colors */
      --gantt-border-primary: ${colors.borderPrimary};
      --gantt-border-secondary: ${colors.borderSecondary};
      --gantt-border-light: ${colors.borderLight};
      
      /* Status Colors */
      --gantt-status-success: ${colors.statusSuccess};
      --gantt-status-warning: ${colors.statusWarning};
      --gantt-status-error: ${colors.statusError};
      --gantt-status-info: ${colors.statusInfo};
      --gantt-status-todo: ${colors.statusTodo};
      --gantt-status-in-progress: ${colors.statusInProgress};
      --gantt-status-done: ${colors.statusDone};
      --gantt-status-blocked: ${colors.statusBlocked};
      
      /* Task Bar Colors */
      --gantt-taskbar-bg: ${colors.taskBarBackground};
      --gantt-taskbar-border: ${colors.taskBarBorder};
      --gantt-taskbar-hover: ${colors.taskBarHover};
      --gantt-taskbar-selected: ${colors.taskBarSelected};
      --gantt-taskbar-progress: ${colors.taskBarProgress};
      
      /* Timeline Colors */
      --gantt-timeline-grid: ${colors.timelineGrid};
      --gantt-timeline-header: ${colors.timelineHeader};
      --gantt-timeline-today: ${colors.timelineToday};
      --gantt-timeline-today-marker: ${colors.timelineTodayMarker};
      
      /* Non-working Days */
      --gantt-non-working-day: ${colors.nonWorkingDay};
      --gantt-holiday: ${colors.holiday};
      --gantt-weekend: ${colors.weekend};
      
      /* Dependency & Milestone */
      --gantt-dependency-line: ${colors.dependencyLine};
      --gantt-dependency-line-hover: ${colors.dependencyLineHover};
      --gantt-milestone-diamond: ${colors.milestoneDiamond};
      --gantt-milestone-bg: ${colors.milestoneBackground};
      
      /* Selection & Focus */
      --gantt-selection-bg: ${colors.selectionBackground};
      --gantt-selection-border: ${colors.selectionBorder};
      --gantt-focus-ring: ${colors.focusRing};
      
      /* Allocation Colors */
      --gantt-allocation-manual: ${colors.allocationManual};
      --gantt-allocation-auto: ${colors.allocationAuto};
      --gantt-allocation-overload: ${colors.allocationOverload};
      
      /* Text Styling */
      --gantt-text-bold: ${colors.textBold};
      --gantt-text-italic: ${colors.textItalic};
      
      /* Scroll & Resize */
      --gantt-scrollbar: ${colors.scrollBar};
      --gantt-scrollbar-hover: ${colors.scrollBarHover};
      --gantt-resize-handle: ${colors.resizeHandle};
    }
  `.trim();
};

// ============================================================================
// EXPORT DEFAULT
// ============================================================================
export default {
  getGanttColors,
  getGanttColor,
  getStatusColors,
  getTailwindClasses,
  useGanttTheme,
  generateCSSVariables,
  LIGHT_COLORS,
  DARK_COLORS,
  STATUS_COLORS,
  TAILWIND_COLORS,
};
