import { useState, useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface Project {
  id: string;
  name: string;
  code: string;
  color: string;
}

interface Allocation {
  project_id: string;
  effort: number;
}

interface AllocationConflictTooltipProps {
  employeeId: string;
  date: Date;
  allocations: Allocation[];
  projects: Project[];
  currentProjectId: string;
  totalEffort: number;
  className?: string;
}

export function AllocationConflictTooltip({
  employeeId,
  date,
  allocations,
  projects,
  currentProjectId,
  totalEffort,
  className
}: AllocationConflictTooltipProps) {
  // Get all allocations for this employee on this date
  const projectAllocations = useMemo(() => {
    return allocations
      .filter(a => a.effort > 0)
      .map(a => {
        const project = projects.find(p => p.id === a.project_id);
        return {
          projectId: a.project_id,
          projectName: project?.name || 'Unknown',
          projectCode: project?.code || '?',
          projectColor: project?.color || '#888',
          effort: a.effort,
          isCurrentProject: a.project_id === currentProjectId
        };
      })
      .sort((a, b) => {
        // Current project first, then by effort desc
        if (a.isCurrentProject) return -1;
        if (b.isCurrentProject) return 1;
        return b.effort - a.effort;
      });
  }, [allocations, projects, currentProjectId]);

  if (projectAllocations.length === 0) return null;

  const isOverloaded = totalEffort > 1;
  const hasConflictWithOtherProjects = projectAllocations.some(a => !a.isCurrentProject);

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("cursor-help", className)}>
            <AlertTriangle 
              className={cn(
                "w-2.5 h-2.5",
                isOverloaded ? "text-destructive" : "text-warning"
              )} 
            />
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          align="center"
          className="max-w-[280px] p-0 bg-popover border border-border shadow-lg"
        >
          <div className="p-2.5">
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle className={cn(
                "w-3.5 h-3.5",
                isOverloaded ? "text-destructive" : "text-warning"
              )} />
              <span className={cn(
                "text-xs font-semibold",
                isOverloaded ? "text-destructive" : "text-warning"
              )}>
                {isOverloaded ? 'Quá tải nguồn lực' : 'Xung đột nguồn lực'}
              </span>
            </div>
            
            <div className="text-[10px] text-muted-foreground mb-2">
              Tổng effort: <span className={cn(
                "font-bold",
                isOverloaded ? "text-destructive" : "text-foreground"
              )}>{totalEffort.toFixed(1)}</span> / 1.0
            </div>

            <div className="space-y-1.5 border-t border-border pt-2">
              <div className="text-[10px] text-muted-foreground font-medium mb-1">
                Chi tiết theo dự án:
              </div>
              {projectAllocations.map((pa) => (
                <div 
                  key={pa.projectId} 
                  className={cn(
                    "flex items-center justify-between gap-2 py-1 px-1.5 rounded text-[10px]",
                    pa.isCurrentProject 
                      ? "bg-primary/10 border border-primary/20" 
                      : "bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div 
                      className="w-2 h-2 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: pa.projectColor }}
                    />
                    <span className="truncate font-medium" title={pa.projectName}>
                      {pa.projectCode}
                    </span>
                    <span className="text-muted-foreground truncate">
                      {pa.projectName}
                    </span>
                    {pa.isCurrentProject && (
                      <span className="text-[8px] text-primary font-medium">(hiện tại)</span>
                    )}
                  </div>
                  <span className={cn(
                    "font-bold flex-shrink-0",
                    pa.effort > 0.5 && !pa.isCurrentProject && "text-warning"
                  )}>
                    {pa.effort}
                  </span>
                </div>
              ))}
            </div>

            {hasConflictWithOtherProjects && (
              <div className="mt-2 pt-2 border-t border-border text-[9px] text-muted-foreground">
                Nhân viên đang được phân bổ cho nhiều dự án trong cùng ngày.
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
