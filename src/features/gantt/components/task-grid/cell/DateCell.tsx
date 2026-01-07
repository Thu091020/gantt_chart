import { parseISO } from "date-fns";
import { cn } from "../../internal/utils";
import { Button, Popover, PopoverTrigger, PopoverContent, Calendar } from "../../internal/ui";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import React from "react";

interface DateCellProps {
  value: string | null;
  taskId: string;
  field: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (taskId: string, field: string, date: Date | undefined) => void;
  textStyleClasses?: string;
}

export const DateCell = ({ value, taskId, field, isOpen, onOpenChange, onSelect, textStyleClasses }: DateCellProps) => (
  <Popover open={isOpen} onOpenChange={onOpenChange}>
    <PopoverTrigger asChild>
      <Button variant="ghost" size="sm" 
        className={cn("h-5 w-full justify-start text-[11px] p-0.5 hover:bg-secondary/50", textStyleClasses)}>
        <CalendarIcon className="w-3 h-3 mr-1 opacity-50" />
        {value ? format(parseISO(value), 'dd/MM/yy') : '-'}
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-0" align="start">
      <Calendar mode="single" selected={value ? parseISO(value) : undefined}
        onSelect={(date) => onSelect(taskId, field, date || undefined)}
        defaultMonth={value ? parseISO(value) : undefined}
        initialFocus locale={vi} className="pointer-events-auto" />
    </PopoverContent>
  </Popover>
);
export default React.memo(DateCell);