/**
 * Gantt Feature Utilities
 * 
 * Aggregates utility functions from all sub-modules
 */

// Date utilities
export * from './lib/date-utils';

// Gantt calculations
export * from './lib/gantt-utils';

// Tree/hierarchy utilities
export * from './lib/tree-utils';

// Helper function to check if a date is weekend
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

// Helper function to check if date is working day
export function isWorkingDay(date: Date, holidays: { date: string }[] = []): boolean {
  if (isWeekend(date)) return false;
  
  const dateStr = date.toISOString().split('T')[0];
  return !holidays.some(h => h.date === dateStr);
}

// Get business days between two dates
export function getBusinessDaysBetween(startDate: Date, endDate: Date, holidays: { date: string }[] = []): number {
  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    if (isWorkingDay(current, holidays)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}
