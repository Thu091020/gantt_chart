import { useMemo, useCallback } from 'react';
import { format, addMonths, addDays, eachDayOfInterval, startOfMonth, isSaturday } from 'date-fns';
import { vi } from 'date-fns/locale';
import { GanttViewMode } from '../../components/toolbar/GanttToolbar';
import { useWorkCalendar } from '../useWorkCalendar';
import { isHoliday as checkIsHoliday, checkSaturdayWorkingDay as checkSaturdayWorkingDayUtil } from '../../utils/dateUtils';

export function useTimeline(
  startDate: Date,
  endDate: Date,
  viewMode: GanttViewMode,
  customViewMode: boolean,
  taskDateRange: { minDate: Date | null; maxDate: Date | null }
) {
  const workCalendar = useWorkCalendar();

  // Logic kiểm tra ngày nghỉ lễ - sử dụng từ workCalendar
  const isHoliday = useCallback(
    (date: Date) => checkIsHoliday(date, workCalendar.holidays),
    [workCalendar.holidays]
  );

  // Logic kiểm tra thứ 7 làm việc - sử dụng từ workCalendar
  const checkSaturdayWorkingDay = useCallback(
    (date: Date) => checkSaturdayWorkingDayUtil(date, workCalendar.settings),
    [workCalendar.settings]
  );

  // Sử dụng isNonWorkingDay từ workCalendar
  const isNonWorkingDay = workCalendar.isNonWorkingDay;

  // Tạo columns cho Timeline
  const timelineColumns = useMemo(() => {
    let timelineEnd: Date;
    const defaultEnd = addMonths(startDate, viewMode === 'day' ? 2 : viewMode === 'week' ? 4 : 12);
    
    if (customViewMode) {
      timelineEnd = endDate;
    } else if (taskDateRange.maxDate && taskDateRange.maxDate > defaultEnd) {
      timelineEnd = addDays(taskDateRange.maxDate, 7);
    } else {
      timelineEnd = defaultEnd;
    }

    const days = eachDayOfInterval({ start: startDate, end: timelineEnd });

    if (viewMode === 'day') {
      return days.map((d) => ({
        date: d,
        label: format(d, 'dd/MM'),
        subLabel: format(d, 'EEE', { locale: vi }),
        width: 32,
        days: 1,
      }));
    } else if (viewMode === 'week') {
      const WEEK_COL_WIDTH = 84;
      const weeks: any[] = [];
      let currentWeek = days[0];
      let weekDays = 0;
      days.forEach((day, idx) => {
        weekDays++;
        if (day.getDay() === 0 || idx === days.length - 1) {
          weeks.push({
            date: currentWeek,
            label: `T${format(currentWeek, 'w')}`,
            subLabel: format(currentWeek, 'dd/MM'),
            width: WEEK_COL_WIDTH,
            days: weekDays,
          });
          currentWeek = addDays(day, 1);
          weekDays = 0;
        }
      });
      return weeks;
    } else {
      const MONTH_COL_WIDTH = 100;
      const months: any[] = [];
      let currentMonth = startOfMonth(days[0]);
      let monthDays = 0;
      days.forEach((day, idx) => {
        monthDays++;
        if (idx === days.length - 1 || startOfMonth(addDays(day, 1)).getTime() !== currentMonth.getTime()) {
          months.push({
            date: currentMonth,
            label: format(currentMonth, 'MMM', { locale: vi }),
            subLabel: format(currentMonth, 'yyyy'),
            width: MONTH_COL_WIDTH,
            days: monthDays,
          });
          currentMonth = startOfMonth(addDays(day, 1));
          monthDays = 0;
        }
      });
      return months;
    }
  }, [startDate, endDate, customViewMode, viewMode, taskDateRange]);

  return { timelineColumns, isNonWorkingDay, isHoliday, checkSaturdayWorkingDay };
}