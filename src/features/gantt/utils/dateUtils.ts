/**
 * Date utility functions for Gantt chart
 * Handles working days, holidays, and date calculations
 */

import { format, addDays, isSaturday, isSunday } from 'date-fns';

export interface Holiday {
  id: string;
  date: string;
  end_date: string | null;
  name: string;
  is_recurring: boolean;
}

export interface SaturdaySchedule {
  enabled: boolean;
  alternating?: boolean;
  referenceStartDate?: string;
  startWeekWithSaturday?: boolean;
}

export interface Settings {
  saturday_schedule?: SaturdaySchedule;
  saturday_work_mode?: 'all' | 'none' | 'odd' | 'even';
}

/**
 * Check if a date is a holiday
 */
export function isHoliday(date: Date, holidays: Holiday[]): boolean {
  const dateStr = format(date, 'yyyy-MM-dd');
  const monthDay = format(date, 'MM-dd');
  
  return holidays.some((h) => {
    if (h.is_recurring) {
      const startMonthDay = h.date.slice(5);
      const endMonthDay = h.end_date ? h.end_date.slice(5) : startMonthDay;
      return monthDay >= startMonthDay && monthDay <= endMonthDay;
    }
    const endDate = h.end_date || h.date;
    return dateStr >= h.date && dateStr <= endDate;
  });
}

/**
 * Check if Saturday is a working day based on company settings
 */
export function checkSaturdayWorkingDay(date: Date, settings?: Settings): boolean {
  // Support new saturday_schedule format
  if (settings?.saturday_schedule) {
    const schedule = settings.saturday_schedule;
    if (!schedule.enabled) return false;
    if (!schedule.alternating) return true; // All Saturdays are working days

    // Use reference date for alternating calculation
    let referenceDate: Date;
    if (schedule.referenceStartDate) {
      referenceDate = new Date(schedule.referenceStartDate);
    } else {
      referenceDate = new Date(2024, 0, 1); // default reference: Jan 1, 2024
    }

    const diffTime = date.getTime() - referenceDate.getTime();
    const diffWeeks = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000));
    const isEvenWeek = diffWeeks % 2 === 0;

    if (schedule.referenceStartDate) {
      return isEvenWeek; // Follow even/odd based on reference date
    }
    return schedule.startWeekWithSaturday ? isEvenWeek : !isEvenWeek;
  }

  // Legacy support for old saturday_work_mode
  if (!settings?.saturday_work_mode) return false;
  const mode = settings.saturday_work_mode;
  if (mode === 'all') return true;
  if (mode === 'none') return false;
  if (mode === 'odd' || mode === 'even') {
    const weekOfMonth = Math.ceil(date.getDate() / 7);
    return mode === 'odd' ? weekOfMonth % 2 === 1 : weekOfMonth % 2 === 0;
  }
  return false;
}

/**
 * Check if date is a non-working day
 */
export function isNonWorkingDay(
  date: Date,
  holidays: Holiday[],
  settings?: Settings
): boolean {
  if (isHoliday(date, holidays)) return true;
  if (isSunday(date)) return true;
  if (isSaturday(date)) return !checkSaturdayWorkingDay(date, settings);
  return false;
}

/**
 * Count working days between two dates
 */
export function countWorkingDays(
  start: Date,
  end: Date,
  holidays: Holiday[],
  settings?: Settings
): number {
  if (start > end) return 0;
  let count = 0;
  let current = new Date(start);
  while (current <= end) {
    if (!isNonWorkingDay(current, holidays, settings)) {
      count++;
    }
    current = addDays(current, 1);
  }
  return count;
}

/**
 * Add working days to a date
 */
export function addWorkingDays(
  date: Date,
  days: number,
  holidays: Holiday[],
  settings?: Settings
): Date {
  let current = new Date(date);
  let remaining = days - 1; // duration includes start date

  while (remaining > 0) {
    current = addDays(current, 1);
    if (!isNonWorkingDay(current, holidays, settings)) {
      remaining--;
    }
  }
  return current;
}

/**
 * Get next working day after a date
 */
export function getNextWorkingDay(
  date: Date,
  holidays: Holiday[],
  settings?: Settings
): Date {
  let current = addDays(date, 1);
  while (isNonWorkingDay(current, holidays, settings)) {
    current = addDays(current, 1);
  }
  return current;
}

