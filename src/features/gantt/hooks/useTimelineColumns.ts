import { useMemo } from 'react';
import { addDays, addMonths, startOfWeek, startOfMonth, endOfMonth, format } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { GanttViewMode } from './useGanttTimeline';

interface TimelineColumn {
  date: Date;
  label: string;
  subLabel: string;
  width: number;
  days: number;
}

/**
 * Hook generate timeline columns theo viewMode
 * Tách từ useGanttTimeline để dễ quản lý
 */
export function useTimelineColumns(startDate: Date, endDate: Date, viewMode: GanttViewMode) {
  
  return useMemo((): TimelineColumn[] => {
    const columns: TimelineColumn[] = [];
    
    if (viewMode === 'day') {
      // ==================== Day View ====================
      let current = new Date(startDate);
      while (current <= endDate) {
        columns.push({
          date: new Date(current),
          label: format(current, 'dd', { locale: vi }),
          subLabel: format(current, 'EEE', { locale: vi }),
          width: 40,
          days: 1,
        });
        current = addDays(current, 1);
      }
      
    } else if (viewMode === 'week') {
      // ==================== Week View ====================
      let current = startOfWeek(startDate, { weekStartsOn: 1 });
      const endWeek = startOfWeek(endDate, { weekStartsOn: 1 });
      
      while (current <= endWeek) {
        const weekEnd = addDays(current, 6);
        columns.push({
          date: new Date(current),
          label: `${format(current, 'dd/MM')} - ${format(weekEnd, 'dd/MM')}`,
          subLabel: format(current, "'W'ww", { locale: vi }),
          width: 100,
          days: 7,
        });
        current = addDays(current, 7);
      }
      
    } else if (viewMode === 'month') {
      // ==================== Month View ====================
      let current = startOfMonth(startDate);
      const endMonthDate = endOfMonth(endDate);
      
      while (current <= endMonthDate) {
        const monthEnd = endOfMonth(current);
        const daysInMonth = monthEnd.getDate();
        
        columns.push({
          date: new Date(current),
          label: format(current, 'MMMM yyyy', { locale: vi }),
          subLabel: format(current, 'MM/yy', { locale: vi }),
          width: daysInMonth * 2,
          days: daysInMonth,
        });
        current = addMonths(current, 1);
      }
      
    } else if (viewMode === 'quarter') {
      // ==================== Quarter View ====================
      let current = startOfMonth(startDate);
      current = new Date(current.getFullYear(), Math.floor(current.getMonth() / 3) * 3, 1);
      
      while (current <= endDate) {
        const quarterEnd = addMonths(current, 3);
        const quarter = Math.floor(current.getMonth() / 3) + 1;
        
        columns.push({
          date: new Date(current),
          label: `Q${quarter} ${current.getFullYear()}`,
          subLabel: `Q${quarter}`,
          width: 120,
          days: 90, // Approximate
        });
        current = quarterEnd;
      }
    }
    
    return columns;
  }, [startDate, endDate, viewMode]);
}
