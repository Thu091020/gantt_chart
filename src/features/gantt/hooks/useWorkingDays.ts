import { useCallback } from 'react';
import { format } from 'date-fns';

interface Holiday {
  id: string;
  date: string;
  end_date: string | null;
  name: string;
  is_recurring: boolean;
}

interface Settings {
  saturday_schedule?: {
    enabled: boolean;
    alternating?: boolean;
    referenceStartDate?: string;
  };
}

/**
 * Hook tính toán working days (ngày làm việc)
 * Tách từ useGanttCalculations để dễ quản lý
 */
export function useWorkingDays(holidays: Holiday[], settings: Settings) {
  
  /**
   * Check if a date is a holiday
   */
  const isHoliday = useCallback((date: Date) => {
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
  }, [holidays]);

  /**
   * Check if Saturday is a working day based on company settings
   */
  const checkSaturdayWorkingDay = useCallback((date: Date) => {
    if (!settings?.saturday_schedule?.enabled) return false;
    
    const schedule = settings.saturday_schedule;
    if (!schedule.alternating) return true; // All Saturdays are working days
    
    // Alternating schedule logic
    let referenceDate: Date;
    if (schedule.referenceStartDate) {
      referenceDate = new Date(schedule.referenceStartDate);
    } else {
      referenceDate = new Date('2025-01-04'); // Default reference
    }
    
    const diffInDays = Math.floor((date.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
    const weekNumber = Math.floor(diffInDays / 7);
    
    return weekNumber % 2 === 0; // Even weeks = working Saturday
  }, [settings]);

  /**
   * Check if date is a non-working day (weekend or holiday)
   */
  const isNonWorkingDay = useCallback((date: Date) => {
    const isSat = date.getDay() === 6;
    const isSun = date.getDay() === 0;
    
    if (isSun) return true;
    if (isSat && !checkSaturdayWorkingDay(date)) return true;
    if (isHoliday(date)) return true;
    
    return false;
  }, [checkSaturdayWorkingDay, isHoliday]);

  /**
   * Count working days between two dates
   */
  const countWorkingDays = useCallback((start: Date, end: Date) => {
    let count = 0;
    let current = new Date(start);
    
    while (current <= end) {
      if (!isNonWorkingDay(current)) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return count;
  }, [isNonWorkingDay]);

  /**
   * Add working days to a date
   */
  const addWorkingDays = useCallback((date: Date, days: number) => {
    let current = new Date(date);
    let remaining = days;
    
    while (remaining > 0) {
      current.setDate(current.getDate() + 1);
      if (!isNonWorkingDay(current)) {
        remaining--;
      }
    }
    
    return current;
  }, [isNonWorkingDay]);

  /**
   * Get next working day
   */
  const getNextWorkingDay = useCallback((date: Date) => {
    let next = new Date(date);
    next.setDate(next.getDate() + 1);
    
    while (isNonWorkingDay(next)) {
      next.setDate(next.getDate() + 1);
    }
    
    return next;
  }, [isNonWorkingDay]);

  return {
    isHoliday,
    checkSaturdayWorkingDay,
    isNonWorkingDay,
    countWorkingDays,
    addWorkingDays,
    getNextWorkingDay,
  };
}
