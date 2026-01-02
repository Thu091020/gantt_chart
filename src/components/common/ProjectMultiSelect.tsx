import { useState } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface Project {
  id: string;
  name: string;
  color: string;
}

interface ProjectMultiSelectProps {
  projects: Project[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function ProjectMultiSelect({ projects, selectedIds, onChange }: ProjectMultiSelectProps) {
  const [open, setOpen] = useState(false);

  const toggleProject = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(i => i !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const selectedProjects = projects.filter(p => selectedIds.includes(p.id));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
          {selectedIds.length === 0 ? (
            <>Tất cả dự án</>
          ) : (
            <>{selectedIds.length} dự án</>
          )}
          <ChevronsUpDown className="w-3 h-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-2" align="start">
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
        <div className="space-y-0.5 max-h-[200px] overflow-y-auto scrollbar-thin">
          {projects.map(project => (
            <button
              key={project.id}
              onClick={() => toggleProject(project.id)}
              className={cn(
                'w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-secondary/50',
                selectedIds.includes(project.id) && 'bg-secondary'
              )}
            >
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: project.color }} />
              <span className="flex-1 text-left truncate">{project.name}</span>
              {selectedIds.includes(project.id) && <Check className="w-3 h-3" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}