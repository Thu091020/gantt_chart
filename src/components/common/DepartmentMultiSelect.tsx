import { useState } from 'react';
import { Check, ChevronsUpDown, X, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DepartmentMultiSelectProps {
  departments: string[];
  selectedDepartments: string[];
  onChange: (departments: string[]) => void;
}

export function DepartmentMultiSelect({ departments, selectedDepartments, onChange }: DepartmentMultiSelectProps) {
  const [open, setOpen] = useState(false);

  const toggleDepartment = (dept: string) => {
    if (selectedDepartments.includes(dept)) {
      onChange(selectedDepartments.filter(d => d !== dept));
    } else {
      onChange([...selectedDepartments, dept]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
          <Building2 className="w-3 h-3" />
          {selectedDepartments.length === 0 ? (
            <>Tất cả phòng ban</>
          ) : (
            <>{selectedDepartments.length} phòng ban</>
          )}
          <ChevronsUpDown className="w-3 h-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-2" align="start">
        {selectedDepartments.length > 0 && (
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
        <div className="space-y-0.5 max-h-[200px] overflow-y-auto scrollbar-thin">
          {departments.map(dept => (
            <button
              key={dept}
              onClick={() => toggleDepartment(dept)}
              className={cn(
                'w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-secondary/50',
                selectedDepartments.includes(dept) && 'bg-secondary'
              )}
            >
              <span className="flex-1 text-left truncate">{dept}</span>
              {selectedDepartments.includes(dept) && <Check className="w-3 h-3" />}
            </button>
          ))}
          {departments.length === 0 && (
            <div className="text-xs text-muted-foreground text-center py-2">
              Không có phòng ban
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
