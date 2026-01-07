import { Task } from '../../types/task.types';
import { parseISO, addDays } from 'date-fns';

interface GanttDependenciesProps {
  tasks: Task[];
  getDatePosition: (date: Date) => number;
}

export const GanttDependencies = ({ tasks, getDatePosition }: GanttDependenciesProps) => {
  return (
    <>
      {/* Arrow marker definition */}
      <svg className="absolute w-0 h-0 pointer-events-none">
        <defs>
          <marker
            id="arrowhead"
            markerWidth="6"
            markerHeight="6"
            refX="5"
            refY="3"
            orient="auto"
          >
            <polygon
              points="0 0, 6 3, 0 6"
              fill="hsl(var(--muted-foreground))"
            />
          </marker>
        </defs>
      </svg>

      {/* Dependencies - render for each task */}
      {tasks.map((task, idx) => {
        if (!task.predecessors?.length) return null;

        return task.predecessors.map((predId) => {
          const predecessor = tasks.find((t) => t.id === predId);
          if (!predecessor?.end_date || !task.start_date) return null;

          const predEnd = parseISO(predecessor.end_date);
          const taskStart = parseISO(task.start_date);

          // Use end-exclusive position for inclusive day rendering
          const predX = getDatePosition(addDays(predEnd, 1));
          const taskX = getDatePosition(taskStart);

          const predRow = tasks.findIndex((t) => t.id === predId);
          const currentRow = idx;

          if (predRow === -1) return null;

          // Calculate positions relative to container (not row)
          const rowHeight = 28;
          const isPredAbove = predRow < currentRow;
          const heightDiff = Math.abs(currentRow - predRow) * rowHeight;
          
          // Top position: calculate from container (0,0), not from row
          // Current row's top position in container
          const currentRowTop = currentRow * rowHeight;
          const halfHeight = 14;
          
          // Top position in container coordinates
          const top = isPredAbove
            ? currentRowTop - (heightDiff - halfHeight)
            : currentRowTop + halfHeight;

          // SVG Path Calculation (matching the old file logic)
          const startX = predX - Math.min(predX, taskX) + 10;
          const endX = taskX - Math.min(predX, taskX) + 10;
          const startY = isPredAbove ? 0 : heightDiff;
          const endY = isPredAbove ? heightDiff : 0;

          // L-shaped path
          const d = `M ${startX} ${startY} 
                     L ${startX + 5} ${startY} 
                     L ${startX + 5} ${endY} 
                     L ${endX} ${endY}`;

          return (
            <svg
              key={`${task.id}-${predId}`}
              className="absolute pointer-events-none"
              style={{
                left: Math.min(predX, taskX) - 10,
                top: top,
                width: Math.abs(taskX - predX) + 20,
                height: heightDiff,
                zIndex: 15, // Above task bars (which have z-10)
              }}
            >
              <path
                d={d}
                fill="none"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth="1"
                markerEnd="url(#arrowhead)"
              />
            </svg>
          );
        });
      })}
    </>
  );
};