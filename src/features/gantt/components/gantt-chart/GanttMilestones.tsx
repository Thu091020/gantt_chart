import { ProjectMilestone } from '../../types/gantt.types';
import { parseISO, addDays, format } from 'date-fns';

interface GanttMilestonesProps {
  milestones: ProjectMilestone[];
  getDatePosition: (date: Date) => number;
  totalWidth: number;
}

export const GanttMilestones = ({ milestones, getDatePosition, totalWidth }: GanttMilestonesProps) => {
  return (
    <>
      {milestones.map((milestone) => {
        const milestoneDate = parseISO(milestone.date);
        const pos = getDatePosition(milestoneDate);

        if (pos < 0 || pos > totalWidth) return null;

        const nextPos = getDatePosition(addDays(milestoneDate, 1));
        const dayWidth = Math.max(1, nextPos - pos);
        const centerPos = pos + dayWidth / 2;

        return (
          <div
            key={milestone.id}
            className="absolute top-0 bottom-0 z-20 group cursor-pointer pointer-events-none hover:pointer-events-auto"
            style={{ left: centerPos - 1 }}
          >
            {/* Dashed line */}
            <div
              className="w-0.5 h-full"
              style={{
                backgroundImage: `repeating-linear-gradient(to bottom, ${milestone.color} 0px, ${milestone.color} 6px, transparent 6px, transparent 12px)`,
              }}
            />
            {/* Diamond marker */}
            <div
              className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45"
              style={{ backgroundColor: milestone.color }}
            />
            
             {/* Tooltip */}
             <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity z-30 pointer-events-none">
                <div
                  className="px-2 py-1 rounded text-xs text-white whitespace-nowrap shadow-lg"
                  style={{ backgroundColor: milestone.color }}
                >
                  <div className="font-medium">{milestone.name}</div>
                  <div className="text-[10px] opacity-80">
                    {format(milestoneDate, 'dd/MM/yyyy')}
                  </div>
                  {milestone.description && (
                    <div className="text-[10px] opacity-80 mt-0.5 max-w-[150px] truncate">
                      {milestone.description}
                    </div>
                  )}
                </div>
              </div>
          </div>
        );
      })}
    </>
  );
};