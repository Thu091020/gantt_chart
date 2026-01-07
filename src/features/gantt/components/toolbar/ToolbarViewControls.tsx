import { Button, Separator } from '../internal/ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DateRangePickerPopup } from '../common/DateRangePickerPopup';
import { cn } from '../internal/utils';
import type { GanttViewMode } from './GanttToolbar'; // Import type từ file gốc hoặc file types

interface ToolbarViewControlsProps {
  viewMode: GanttViewMode;
  customViewMode: boolean;
  startDate: Date;
  endDate: Date;
  onViewModeChange: (mode: GanttViewMode) => void;
  onRangeChange: (start: Date, end: Date) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}

export function ToolbarViewControls({
  viewMode,
  customViewMode,
  startDate,
  endDate,
  onViewModeChange,
  onRangeChange,
  onPrevious,
  onNext,
  onToday,
}: ToolbarViewControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onPrevious}>
          <ChevronLeft className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={onToday}>
          Hôm nay
        </Button>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onNext}>
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-5" />

      <div className="flex gap-0.5 bg-secondary/50 p-0.5 rounded">
        {(['day', 'week', 'month'] as const).map((m) => (
          <button
            key={m}
            onClick={() => onViewModeChange(m)}
            className={cn(
              'px-2 py-0.5 text-[10px] rounded transition-colors',
              viewMode === m && !customViewMode
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {m === 'day' ? 'Ngày' : m === 'week' ? 'Tuần' : 'Tháng'}
          </button>
        ))}
      </div>

      <DateRangePickerPopup
        startDate={startDate}
        endDate={endDate}
        onRangeChange={onRangeChange}
      />
    </div>
  );
}