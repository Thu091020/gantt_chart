import { 
  addDays, 
  eachDayOfInterval, 
  format, 
  isWeekend, 
  parseISO, 
  isWithinInterval,
  getYear,
  setYear 
} from 'date-fns';

export interface Holiday {
  id: string;
  date: string;
  end_date: string | null;
  name: string;
  is_recurring: boolean;
}

export interface SaturdaySchedule {
  enabled: boolean;
  alternating: boolean;
  startWeekWithSaturday?: boolean;
  referenceStartDate?: string;
}

/**
 * Check if a date is a holiday
 */
export function isHoliday(date: Date, holidays: Holiday[]): boolean {
  const dateStr = format(date, 'yyyy-MM-dd');
  const monthDay = format(date, 'MM-dd');
  
  return holidays.some(h => {
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
 * Check if Saturday is a working day based on schedule
 */
export function checkSaturdayWorkingDay(
  date: Date,
  saturdaySchedule?: SaturdaySchedule
): boolean {
  if (!saturdaySchedule?.enabled) return false;
  if (!saturdaySchedule.alternating) return true;
  
  let referenceDate: Date;
  if (saturdaySchedule.referenceStartDate) {
    referenceDate = new Date(saturdaySchedule.referenceStartDate);
  } else {
    referenceDate = new Date(2024, 0, 1);
  }
  
  const diffTime = date.getTime() - referenceDate.getTime();
  const diffWeeks = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000));
  const isEvenWeek = diffWeeks % 2 === 0;
  
  if (saturdaySchedule.referenceStartDate) {
    return isEvenWeek;
  }
  return saturdaySchedule.startWeekWithSaturday ? isEvenWeek : !isEvenWeek;
}

/**
 * Check if a date is a non-working day
 */
export function isNonWorkingDay(
  date: Date,
  holidays: Holiday[],
  saturdaySchedule?: SaturdaySchedule
): boolean {
  if (isHoliday(date, holidays)) return true;
  if (date.getDay() === 0) return true; // Sunday
  if (date.getDay() === 6) return !checkSaturdayWorkingDay(date, saturdaySchedule);
  return false;
}

/**
 * Count working days between two dates
 */
export function countWorkingDays(
  start: Date,
  end: Date,
  holidays: Holiday[],
  saturdaySchedule?: SaturdaySchedule
): number {
  if (start > end) return 0;
  let count = 0;
  let current = new Date(start);
  while (current <= end) {
    if (!isNonWorkingDay(current, holidays, saturdaySchedule)) {
      count++;
    }
    current = addDays(current, 1);
  }
  return count;
}

/**
 * Add working days to a date (skipping weekends and holidays)
 */
export function addWorkingDays(
  date: Date,
  days: number,
  holidays: Holiday[],
  saturdaySchedule?: SaturdaySchedule
): Date {
  let current = new Date(date);
  let remaining = days - 1; // duration includes start date
  
  while (remaining > 0) {
    current = addDays(current, 1);
    if (!isNonWorkingDay(current, holidays, saturdaySchedule)) {
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
  saturdaySchedule?: SaturdaySchedule
): Date {
  let current = addDays(date, 1);
  while (isNonWorkingDay(current, holidays, saturdaySchedule)) {
    current = addDays(current, 1);
  }
  return current;
}
