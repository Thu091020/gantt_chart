import { useState } from 'react';
import { Button, Popover, PopoverContent, PopoverTrigger, Input } from '../internal/ui';
import { Users, X, Check } from 'lucide-react';
import { cn } from '../internal/utils';

interface FilterEmployee {
  id: string;
  name: string;
  code: string;
}

interface ToolbarFilterProps {
  employees: FilterEmployee[];
  assigneeIds: string[];
  onChange: (ids: string[]) => void;
}

export function ToolbarFilter({ employees, assigneeIds, onChange }: ToolbarFilterProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.code.toLowerCase().includes(search.toLowerCase())
  );

  const toggleEmployee = (id: string) => {
    if (assigneeIds.includes(id)) {
      onChange(assigneeIds.filter((i) => i !== id));
    } else {
      onChange([...assigneeIds, id]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={assigneeIds.length > 0 ? 'secondary' : 'ghost'}
          size="sm"
          className={cn(
            'h-7 px-2 gap-1 text-xs',
            assigneeIds.length > 0 && 'bg-primary/10 text-primary border border-primary/30'
          )}
        >
          <Users className="w-3.5 h-3.5" />
          {assigneeIds.length === 0 ? 'Lọc nhà thầu' : <>{assigneeIds.length} nhà thầu</>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-2" align="start">
        <div className="space-y-2">
          <div className="text-sm font-medium">Lọc theo nhà thầu thực hiện</div>
          <Input
            placeholder="Tìm nhà thầu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-7 text-xs"
          />
          {assigneeIds.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs text-muted-foreground h-7"
              onClick={() => {
                onChange([]);
                setOpen(false);
              }}
            >
              <X className="w-3 h-3 mr-1" />
              Bỏ lọc ({assigneeIds.length} đang chọn)
            </Button>
          )}
          <div className="space-y-0.5 max-h-[250px] overflow-y-auto scrollbar-thin">
            {filteredEmployees.map((emp) => (
              <button
                key={emp.id}
                onClick={() => toggleEmployee(emp.id)}
                className={cn(
                  'w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-secondary/50',
                  assigneeIds.includes(emp.id) && 'bg-primary/10'
                )}
              >
                <div className="flex-1 text-left">
                  <div className="truncate font-medium">{emp.name}</div>
                  <div className="text-muted-foreground text-[10px]">{emp.code}</div>
                </div>
                {assigneeIds.includes(emp.id) && <Check className="w-3 h-3 shrink-0 text-primary" />}
              </button>
            ))}
            {filteredEmployees.length === 0 && (
              <div className="text-xs text-muted-foreground text-center py-2">
                Không tìm thấy nhân sự
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}