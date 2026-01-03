import { useMemo } from 'react';
import type { Task } from '../types/task.types';

/**
 * Hook tính toán date range từ tasks
 * Tách từ useGanttTimeline để dễ quản lý
 */
export function useTaskDateRange(tasks: Task[]) {
  return useMemo(() => {
    if (tasks.length === 0) {
      return { minDate: new Date(), maxDate: new Date() };
    }
    
    let minDate = new Date(tasks[0].start_date);
    let maxDate = new Date(tasks[0].end_date);
    
    tasks.forEach(task => {
      const taskStart = new Date(task.start_date);
      const taskEnd = new Date(task.end_date);
      
      if (taskStart < minDate) minDate = taskStart;
      if (taskEnd > maxDate) maxDate = taskEnd;
    });
    
    return { minDate, maxDate };
  }, [tasks]);
}
