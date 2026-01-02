import { useState, useEffect, useRef } from 'react';
import { format, parse, isValid, subYears, addMonths, addWeeks, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, startOfWeek, addDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar as CalendarIcon, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DateRangePickerProps {
  startDate: Date;
  endDate: Date;
  onRangeChange: (start: Date, end: Date) => void;
}

export function DateRangePicker({ startDate, endDate, onRangeChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(format(startDate, 'dd/MM/yyyy'));
  const [tempEndDate, setTempEndDate] = useState(format(endDate, 'dd/MM/yyyy'));
  const [activeField, setActiveField] = useState<'start' | 'end'>('start');
  const [error, setError] = useState('');
  const endInputRef = useRef<HTMLInputElement>(null);

  // Sync temp values when props change
  useEffect(() => {
    setTempStartDate(format(startDate, 'dd/MM/yyyy'));
    setTempEndDate(format(endDate, 'dd/MM/yyyy'));
  }, [startDate, endDate]);

  const parseDate = (dateStr: string): Date | null => {
    const parsed = parse(dateStr, 'dd/MM/yyyy', new Date());
    return isValid(parsed) ? parsed : null;
  };

  const handleApply = () => {
    const start = parseDate(tempStartDate);
    const end = parseDate(tempEndDate);

    if (!start) {
      setError('Ngày bắt đầu không hợp lệ');
      return;
    }
    if (!end) {
      setError('Ngày kết thúc không hợp lệ');
      return;
    }
    if (start > end) {
      setError('Ngày bắt đầu phải trước ngày kết thúc');
      return;
    }

    setError('');
    onRangeChange(start, end);
    setOpen(false);
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (!date) return;
    
    const formatted = format(date, 'dd/MM/yyyy');
    if (activeField === 'start') {
      setTempStartDate(formatted);
      // Auto focus to end date input
      setActiveField('end');
      setTimeout(() => {
        endInputRef.current?.focus();
      }, 50);
    } else {
      setTempEndDate(formatted);
    }
  };

  const getSelectedDate = (): Date | undefined => {
    const dateStr = activeField === 'start' ? tempStartDate : tempEndDate;
    return parseDate(dateStr) || undefined;
  };

  // Presets based on current date
  const today = new Date();
  const presets = [
    { 
      label: '2 tuần', 
      start: startOfWeek(today, { weekStartsOn: 1 }), 
      end: addDays(startOfWeek(today, { weekStartsOn: 1 }), 13) 
    },
    { 
      label: 'Tháng này', 
      start: startOfMonth(today), 
      end: endOfMonth(today) 
    },
    { 
      label: 'Quý này', 
      start: startOfQuarter(today), 
      end: endOfQuarter(today) 
    },
    { 
      label: 'Năm nay', 
      start: startOfYear(today), 
      end: endOfYear(today) 
    },
    { 
      label: '3 tháng', 
      start: today, 
      end: addMonths(today, 3) 
    },
    { 
      label: '6 tháng', 
      start: today, 
      end: addMonths(today, 6) 
    },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
          <CalendarIcon className="w-3.5 h-3.5 text-foreground" />
          {format(startDate, 'dd/MM/yyyy')} - {format(endDate, 'dd/MM/yyyy')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" sideOffset={4}>
        <div className="flex">
          {/* Left side - Input fields */}
          <div className="p-4 border-r border-border space-y-4 min-w-[220px]">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Ngày bắt đầu</Label>
              <Input
                value={tempStartDate}
                onChange={(e) => setTempStartDate(e.target.value)}
                onFocus={() => setActiveField('start')}
                placeholder="dd/MM/yyyy"
                className={cn(
                  "h-8 text-sm",
                  activeField === 'start' && "ring-2 ring-primary"
                )}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-medium">Ngày kết thúc</Label>
              <Input
                ref={endInputRef}
                value={tempEndDate}
                onChange={(e) => setTempEndDate(e.target.value)}
                onFocus={() => setActiveField('end')}
                placeholder="dd/MM/yyyy"
                className={cn(
                  "h-8 text-sm",
                  activeField === 'end' && "ring-2 ring-primary"
                )}
              />
            </div>

            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}

            <Button onClick={handleApply} className="w-full h-8 text-xs gap-1.5">
              <Check className="w-3.5 h-3.5" />
              Áp dụng
            </Button>

            <div className="pt-2 border-t border-border space-y-2">
              <p className="text-[10px] text-muted-foreground font-medium">Chọn nhanh:</p>
              <div className="grid grid-cols-2 gap-1">
                {presets.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] px-2"
                    onClick={() => {
                      setTempStartDate(format(preset.start, 'dd/MM/yyyy'));
                      setTempEndDate(format(preset.end, 'dd/MM/yyyy'));
                    }}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Right side - Calendar */}
          <div className="p-3">
            <p className="text-xs text-muted-foreground mb-2 text-center">
              Đang chọn: <span className="font-medium text-foreground">{activeField === 'start' ? 'Ngày bắt đầu' : 'Ngày kết thúc'}</span>
            </p>
            <Calendar
              mode="single"
              selected={getSelectedDate()}
              onSelect={handleCalendarSelect}
              locale={vi}
              defaultMonth={getSelectedDate() || new Date()}
              fromDate={subYears(new Date(), 5)}
              toDate={new Date(2030, 11, 31)}
              className="pointer-events-auto"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}