import { cn } from '../internal/utils';
import { isSameDay } from 'date-fns';
import { GanttViewMode } from '../../constants';

interface GanttGridProps {
  timelineColumns: {
    date: Date;
    width: number;
  }[];
  viewMode: GanttViewMode;
  isNonWorkingDay: (date: Date) => boolean;
  isHoliday: (date: Date) => boolean;
}

export const GanttGrid = ({
  timelineColumns,
  viewMode,
  isNonWorkingDay,
  isHoliday,
}: GanttGridProps) => {
  return (
    <div className="absolute inset-0 flex pointer-events-none">
      {timelineColumns.map((col, idx) => (
        <div
          key={idx}
          className={cn(
            'border-r border-border/30 h-full',
            viewMode === 'day' && isNonWorkingDay(col.date) && 'bg-muted-foreground/10',
            viewMode === 'day' && isHoliday(col.date) && 'bg-orange-500/10',
            viewMode === 'day' && isSameDay(col.date, new Date()) && 'bg-primary/5'
          )}
          style={{ width: col.width, minWidth: col.width }}
        />
      ))}
    </div>
  );
};