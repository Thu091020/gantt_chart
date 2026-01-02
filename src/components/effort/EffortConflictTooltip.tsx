import { useMemo } from 'react';
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

interface EffortDetail {
  projectId: string;
  projectName: string;
  projectColor: string;
  effort: number;
}

interface EffortConflictTooltipProps {
  totalEffort: number;
  details: EffortDetail[];
  className?: string;
}

export function EffortConflictTooltip({
  totalEffort,
  details,
  className
}: EffortConflictTooltipProps) {
  const sortedDetails = useMemo(() => {
    return [...details]
      .filter(d => d.effort > 0)
      .sort((a, b) => b.effort - a.effort);
  }, [details]);

  if (sortedDetails.length === 0) return null;

  const isOverloaded = totalEffort > 1;

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
                {isOverloaded ? 'Quá tải nguồn lực' : 'Phân bổ nguồn lực'}
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
              {sortedDetails.map((detail) => (
                <div 
                  key={detail.projectId} 
                  className="flex items-center justify-between gap-2 py-1 px-1.5 rounded text-[10px] bg-muted/50"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div 
                      className="w-2 h-2 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: detail.projectColor }}
                    />
                    <span className="truncate font-medium" title={detail.projectName}>
                      {detail.projectName}
                    </span>
                  </div>
                  <span className={cn(
                    "font-bold flex-shrink-0",
                    detail.effort > 0.5 && "text-warning"
                  )}>
                    {detail.effort.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>

            {sortedDetails.length > 1 && (
              <div className="mt-2 pt-2 border-t border-border text-[9px] text-muted-foreground">
                Nhân viên đang được phân bổ cho {sortedDetails.length} dự án trong cùng ngày.
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
