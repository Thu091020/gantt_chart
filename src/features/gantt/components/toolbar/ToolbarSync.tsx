import { useState } from 'react';
import { Button, Popover, PopoverContent, PopoverTrigger, Calendar } from '../internal/ui';
import { RefreshCw, CalendarIcon } from 'lucide-react';
import { format, addMonths, differenceInDays } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ToolbarSyncProps {
  onSync: (startDate: Date, endDate: Date) => void;
}

export function ToolbarSync({ onSync }: ToolbarSyncProps) {
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(addMonths(new Date(), 3));
  const [startPickerOpen, setStartPickerOpen] = useState(false);
  const [endPickerOpen, setEndPickerOpen] = useState(false);

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setStartDate(new Date());
      setEndDate(addMonths(new Date(), 3));
    }
    setOpen(isOpen);
  };

  const getDurationLabel = () => {
    const days = differenceInDays(endDate, startDate);
    const months = days / 30;
    return months < 1 ? `${days} ngày` : `${Math.round(months * 10) / 10} tháng`;
  };

  const handleSync = () => {
    onSync(startDate, endDate);
    setOpen(false);
  };

  // Helper render cho date picker để code gọn hơn
  const renderDatePicker = (
    date: Date,
    setDate: (d: Date) => void,
    isOpen: boolean,
    setIsOpen: (v: boolean) => void
  ) => (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8">
          <CalendarIcon className="w-3 h-3 mr-1" />
          {format(date, 'dd/MM/yyyy')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          defaultMonth={date}
          onSelect={(d) => {
            if (d) {
              setDate(d);
              setIsOpen(false);
            }
          }}
          initialFocus
          locale={vi}
        />
      </PopoverContent>
    </Popover>
  );

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-2 gap-1 text-xs">
          <RefreshCw className="w-3.5 h-3.5" />
          Đồng bộ
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="start">
        <div className="space-y-3">
          <div className="text-sm font-medium">Đồng bộ nguồn lực</div>
          <div className="text-xs text-muted-foreground">
            Chọn khoảng thời gian để đồng bộ allocation từ tasks sang nguồn lực
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Từ ngày</div>
              {renderDatePicker(startDate, setStartDate, startPickerOpen, setStartPickerOpen)}
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Đến ngày</div>
              {renderDatePicker(endDate, setEndDate, endPickerOpen, setEndPickerOpen)}
            </div>
          </div>
          <div className="text-xs text-muted-foreground text-center py-1 bg-secondary/30 rounded">
            Tổng thời gian: <span className="font-medium text-foreground">{getDurationLabel()}</span>
          </div>
          <Button size="sm" className="w-full" onClick={handleSync}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Đồng bộ nguồn lực
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}