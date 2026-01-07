/**
 * useWorkCalendar Hook
 * Đóng gói cấu hình lịch làm việc (holidays và settings)
 * Tạo ra các hàm đã được curried (nạp sẵn holidays và settings)
 * Giúp tránh việc truyền holidays và settings qua nhiều tầng component
 */

import { useCallback } from 'react';
import { useHolidaysAdapter, useViewSettingsAdapter } from '../context/hooks';
import * as dateUtils from '../utils/dateUtils';
import type { Holiday, Settings } from '../utils/dateUtils';

export function useWorkCalendar() {
  const { data: holidays = [] } = useHolidaysAdapter();
  const { data: viewSettings } = useViewSettingsAdapter();

  // Extract settings from viewSettings
  // viewSettings có thể có cấu trúc { settings: {...} } hoặc trực tiếp là settings
  const settings: Settings | undefined = viewSettings?.settings || viewSettings;

  /**
   * Check if a date is a working day
   * @param date - Date to check
   * @returns true if the date is a working day
   */
  const isWorkingDay = useCallback(
    (date: Date): boolean => {
      return !dateUtils.isNonWorkingDay(date, holidays as Holiday[], settings);
    },
    [holidays, settings]
  );

  /**
   * Add working days to a date
   * @param date - Start date
   * @param days - Number of working days to add
   * @returns New date after adding working days
   */
  const addWorkingDays = useCallback(
    (date: Date, days: number): Date => {
      return dateUtils.addWorkingDays(date, days, holidays as Holiday[], settings);
    },
    [holidays, settings]
  );

  /**
   * Count working days between two dates
   * @param start - Start date
   * @param end - End date
   * @returns Number of working days
   */
  const countWorkingDays = useCallback(
    (start: Date, end: Date): number => {
      return dateUtils.countWorkingDays(start, end, holidays as Holiday[], settings);
    },
    [holidays, settings]
  );

  /**
   * Check if a date is a non-working day
   * @param date - Date to check
   * @returns true if the date is a non-working day
   */
  const isNonWorkingDay = useCallback(
    (date: Date): boolean => {
      return dateUtils.isNonWorkingDay(date, holidays as Holiday[], settings);
    },
    [holidays, settings]
  );

  /**
   * Get next working day after a date
   * @param date - Start date
   * @returns Next working day
   */
  const getNextWorkingDay = useCallback(
    (date: Date): Date => {
      return dateUtils.getNextWorkingDay(date, holidays as Holiday[], settings);
    },
    [holidays, settings]
  );

  return {
    isWorkingDay,
    addWorkingDays,
    countWorkingDays,
    isNonWorkingDay,
    getNextWorkingDay,
    // Expose raw data if needed
    holidays: holidays as Holiday[],
    settings,
  };
}

