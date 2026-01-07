import { Eye, ArrowLeft, RotateCcw } from 'lucide-react';
import { Button } from '../internal/ui';

interface GanttBaselineBannerProps {
  baselineName: string;
  taskCount: number;
  onRestore: () => void;
  onExit: () => void;
}

export const GanttBaselineBanner = ({
  baselineName,
  taskCount,
  onRestore,
  onExit,
}: GanttBaselineBannerProps) => {
  return (
    <div className="flex items-center justify-between px-3 py-2 bg-amber-500/20 border-b border-amber-500/30">
      <div className="flex items-center gap-2 text-sm">
        <Eye className="w-4 h-4 text-amber-600" />
        <span className="font-medium text-amber-700 dark:text-amber-400">
          Đang xem baseline: {baselineName}
        </span>
        <span className="text-xs text-amber-600 dark:text-amber-500">
          (Chỉ đọc - {taskCount} tasks)
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="default"
          className="h-7 text-xs"
          onClick={onRestore}
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Khôi phục baseline này
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs border-amber-500/50 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20"
          onClick={onExit}
        >
          <ArrowLeft className="w-3 h-3 mr-1" />
          Quay về bản hiện hành
        </Button>
      </div>
    </div>
  );
};

