import { TaskStatus } from "../../../types/task.types";
import { Select, SelectContent, SelectItem, SelectTrigger } from "../../internal/ui";
import React from "react";
const StatusCell = ({ statusValue, taskStatuses, onUpdate, onSelectTask }: { 
    statusValue: string, taskStatuses: TaskStatus[], onUpdate: (val: string) => void, onSelectTask: () => void 
  }) => {
    const currentStatus = taskStatuses.find(s => s.name.toLowerCase().replace(/\s+/g, '_') === statusValue) 
      || taskStatuses.find(s => s.name === 'To Do');
  
    return (
      <Select value={statusValue || 'todo'} onValueChange={onUpdate} onOpenChange={onSelectTask}>
        <SelectTrigger className="h-5 w-full text-[11px] px-1 border-0 bg-transparent hover:bg-secondary/50"
          onClick={(e) => { e.stopPropagation(); onSelectTask(); }}>
          <div className="flex items-center gap-1 truncate">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: currentStatus?.color || '#6B7280' }} />
            <span className="truncate">{currentStatus?.name || statusValue || 'To Do'}</span>
          </div>
        </SelectTrigger>
        <SelectContent>
          {taskStatuses.map(status => (
            <SelectItem key={status.id} value={status.name.toLowerCase().replace(/\s+/g, '_')} className="text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }} />
                {status.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };
  export default React.memo(StatusCell);