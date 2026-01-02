import { useState } from 'react';
import { Check, ChevronsUpDown, X, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Employee {
  id: string;
  name: string;
  code: string;
  department?: string | null;
}

interface EmployeeMultiSelectProps {
  employees: Employee[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function EmployeeMultiSelect({ employees, selectedIds, onChange }: EmployeeMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const toggleEmployee = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(i => i !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(search.toLowerCase()) ||
    emp.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
          <Users className="w-3 h-3" />
          {selectedIds.length === 0 ? (
            <>Tất cả nhân sự</>
          ) : (
            <>{selectedIds.length} nhân sự</>
          )}
          <ChevronsUpDown className="w-3 h-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-2" align="start">
        <Input
          placeholder="Tìm nhân sự..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-7 text-xs mb-2"
        />
        {selectedIds.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start text-xs mb-1 text-muted-foreground"
            onClick={() => onChange([])}
          >
            <X className="w-3 h-3 mr-1" />
            Bỏ chọn tất cả
          </Button>
        )}
        <div className="space-y-0.5 max-h-[250px] overflow-y-auto scrollbar-thin">
          {filteredEmployees.map(emp => (
            <button
              key={emp.id}
              onClick={() => toggleEmployee(emp.id)}
              className={cn(
                'w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-secondary/50',
                selectedIds.includes(emp.id) && 'bg-secondary'
              )}
            >
              <div className="flex-1 text-left">
                <div className="truncate font-medium">{emp.name}</div>
                <div className="text-muted-foreground text-[10px]">
                  {emp.code} {emp.department && `• ${emp.department}`}
                </div>
              </div>
              {selectedIds.includes(emp.id) && <Check className="w-3 h-3 shrink-0" />}
            </button>
          ))}
          {filteredEmployees.length === 0 && (
            <div className="text-xs text-muted-foreground text-center py-2">
              Không tìm thấy nhân sự
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
