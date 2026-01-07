import { TaskLabel } from "../../../types/task.types";
import { Select, SelectContent, SelectItem, SelectTrigger } from "../../internal/ui";
import React from "react";
const LabelCell = ({ labelId, taskLabels, onUpdate, onSelectTask }: {
    labelId: string | null, taskLabels: TaskLabel[], onUpdate: (val: string | null) => void, onSelectTask: () => void
  }) => {
    const currentLabel = taskLabels.find(l => l.id === labelId) || taskLabels.find(l => l.is_default);
    
    return (
      <Select value={labelId || 'default'} onValueChange={(val) => onUpdate(val === 'default' ? null : val)} onOpenChange={onSelectTask}>
        <SelectTrigger className="h-5 w-full text-[11px] px-1 border-0 bg-transparent hover:bg-secondary/50"
          onClick={(e) => { e.stopPropagation(); onSelectTask(); }}>
          <div className="flex items-center gap-1 truncate">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: currentLabel?.color || '#3b82f6' }} />
            <span className="truncate">{currentLabel?.name || 'Default'}</span>
          </div>
        </SelectTrigger>
        <SelectContent>
          {taskLabels.map(label => (
            <SelectItem key={label.id} value={label.id} className="text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: label.color }} />
                {label.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };
  export default React.memo(LabelCell);