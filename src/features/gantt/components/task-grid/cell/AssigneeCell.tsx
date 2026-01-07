import { cn } from "../../internal/utils";
import { Button, Popover, PopoverTrigger, PopoverContent, Checkbox } from "../../internal/ui";
import React from "react";

interface ProjectMember {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  name: string;
}

interface AssigneeCellProps {
  assignees: string[] | null | undefined;
  projectMembers: ProjectMember[];
  allEmployees: Employee[];
  onUpdate: (assignees: string[]) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  textStyleClasses?: string;
}

const AssigneeCell = ({ assignees, projectMembers, allEmployees, onUpdate, isOpen, onOpenChange, textStyleClasses }: AssigneeCellProps) => {
    const getNames = (ids: string[] | null | undefined) => {
      if (!ids?.length) return '-';
      return ids.map(id => {
        const emp = allEmployees.find((e: Employee) => e.id === id);
        return emp?.name?.split(' ').pop() || id.slice(0, 4);
      }).join(', ');
    };
  
    return (
      <Popover open={isOpen} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" 
            className={cn("h-5 w-full justify-start text-[11px] p-0.5 hover:bg-secondary/50 truncate", textStyleClasses)}>
            {getNames(assignees)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2" align="start">
          <div className="text-xs font-medium mb-2">Assign</div>
          <div className="max-h-48 overflow-y-auto scrollbar-thin space-y-1">
            {projectMembers.length > 0 ? (
              projectMembers.map((member: ProjectMember) => (
                <label key={member.id} className="flex items-center gap-2 py-1 text-xs cursor-pointer hover:bg-secondary/50 rounded px-1">
                  <Checkbox checked={assignees?.includes(member.id) || false}
                    onCheckedChange={() => {
                      const current = assignees || [];
                      const newAssignees = current.includes(member.id) 
                        ? current.filter((id: string) => id !== member.id) 
                        : [...current, member.id];
                      onUpdate(newAssignees);
                    }} />
                  {member.name}
                </label>
              ))
            ) : <div className="text-xs text-muted-foreground">Chưa có thành viên</div>}
          </div>
        </PopoverContent>
      </Popover>
    );
  };
  export default React.memo(AssigneeCell);