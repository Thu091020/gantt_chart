import { forwardRef } from 'react';
import { cn } from '../internal/utils';
import { isSameDay } from 'date-fns';
import { GanttViewMode } from '../toolbar/GanttToolbar';

interface GanttHeaderProps {
  timelineColumns: {
    date: Date;
    label: string;
    subLabel: string;
    width: number;
  }[];
  totalWidth: number;
  viewMode: GanttViewMode;
  isNonWorkingDay: (date: Date) => boolean;
  isHoliday: (date: Date) => boolean;
}

export const GanttHeader = forwardRef<HTMLDivElement, GanttHeaderProps>(
  ({ timelineColumns, totalWidth, viewMode, isNonWorkingDay, isHoliday }, ref) => {
    return (
      <div
        ref={ref}
        className="bg-secondary/50 border-b border-border overflow-hidden shrink-0"
        style={{ height: 42 }}
      >
        <div className="flex h-full" style={{ minWidth: totalWidth }}>
          {timelineColumns.map((col, idx) => (
            <div
              key={idx}
              className={cn(
                'text-center border-r border-border/50 text-[9px] flex flex-col items-center justify-center h-full',
                viewMode === 'day' && isNonWorkingDay(col.date) && 'bg-muted-foreground/20',
                viewMode === 'day' && isHoliday(col.date) && 'bg-muted-foreground/30',
                viewMode === 'day' && isSameDay(col.date, new Date()) && 'bg-primary/20'
              )}
              style={{ width: col.width, minWidth: col.width }}
            >
              <div className="text-muted-foreground leading-tight">{col.subLabel}</div>
              <div className="font-medium leading-tight">{col.label}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }
);