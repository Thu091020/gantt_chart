import { useState, useEffect, useMemo, useCallback } from 'react';

import { useHolidaysAdapter } from '../../context/hooks';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Button, Input, Label, Popover, PopoverContent, PopoverTrigger, Checkbox } from '../internal/ui';
import { format, addDays, parseISO, differenceInDays, isWithinInterval, getYear, setYear, isWeekend, eachDayOfInterval } from 'date-fns';
import { ChevronDown, Search, Check } from 'lucide-react';
import { cn } from '../internal/utils';
import { Task } from '../../types/task.types';

interface Holiday {
  id: string;
  date: string;
  end_date: string | null;
  name: string;
  is_recurring: boolean;
}

// Helper function to check if a date is a holiday
function isHoliday(date: Date, holidays: any[]): boolean {
  const dateStr = format(date, 'yyyy-MM-dd');
  const currentYear = getYear(date);
  
  return holidays.some(holiday => {
    const holidayStart = parseISO(holiday.date);
    const holidayEnd = holiday.end_date ? parseISO(holiday.end_date) : holidayStart;
    
    if (holiday.is_recurring) {
      // For recurring holidays, check against current year
      const recurringStart = setYear(holidayStart, currentYear);
      const recurringEnd = setYear(holidayEnd, currentYear);
      return isWithinInterval(date, { start: recurringStart, end: recurringEnd });
    } else {
      return isWithinInterval(date, { start: holidayStart, end: holidayEnd });
    }
  });
}

// Count working days between two dates (excluding weekends and holidays)
function countWorkingDays(startDate: Date, endDate: Date, holidays: Holiday[]): number {
  if (startDate > endDate) return 0;
  
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  return days.filter(day => !isWeekend(day) && !isHoliday(day, holidays)).length;
}

// Add working days to a date (skipping weekends and holidays)
function addWorkingDays(startDate: Date, workingDays: number, holidays: Holiday[]): Date {
  let currentDate = startDate;
  let daysAdded = 0;
  
  // First day counts if it's a working day
  if (!isWeekend(currentDate) && !isHoliday(currentDate, holidays)) {
    daysAdded = 1;
  }
  
  while (daysAdded < workingDays) {
    currentDate = addDays(currentDate, 1);
    if (!isWeekend(currentDate) && !isHoliday(currentDate, holidays)) {
      daysAdded++;
    }
  }
  
  return currentDate;
}

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  tasks: Task[];
  projectMembers: { id: string; name: string }[];
  onSave: (taskData: Partial<Task>) => void;
}

export function TaskFormDialog({
  open,
  onOpenChange,
  task,
  tasks,
  projectMembers,
  onSave
}: TaskFormDialogProps) {
  const { data: holidays = [] } = useHolidaysAdapter();
  
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [duration, setDuration] = useState(1);
  const [progress, setProgress] = useState(0);
  const [predecessors, setPredecessors] = useState<string[]>([]);
  const [assignees, setAssignees] = useState<string[]>([]);
  const [effortPerAssignee, setEffortPerAssignee] = useState(1);
  const [isMilestone, setIsMilestone] = useState(false);
  const [parentId, setParentId] = useState<string | null>(null);
  
  // Search states
  const [parentSearch, setParentSearch] = useState('');
  const [predecessorSearch, setPredecessorSearch] = useState('');
  const [parentOpen, setParentOpen] = useState(false);
  const [predecessorOpen, setPredecessorOpen] = useState(false);

  useEffect(() => {
    if (task) {
      setName(task.name || '');
      setStartDate(task.start_date || '');
      setEndDate(task.end_date || '');
      setDuration(task.duration || 1);
      setProgress(task.progress || 0);
      setPredecessors(task.predecessors || []);
      setAssignees(task.assignees || []);
      setEffortPerAssignee(task.effort_per_assignee || 1);
      setIsMilestone(task.is_milestone || false);
      setParentId(task.parent_id || null);
    } else {
      setName('');
      setStartDate(format(new Date(), 'yyyy-MM-dd'));
      const defaultEndDate = addWorkingDays(new Date(), 7, holidays);
      setEndDate(format(defaultEndDate, 'yyyy-MM-dd'));
      setDuration(7);
      setProgress(0);
      setPredecessors([]);
      setAssignees([]);
      setEffortPerAssignee(1);
      setIsMilestone(false);
      setParentId(null);
    }
    setParentSearch('');
    setPredecessorSearch('');
  }, [task, open]);

  const handleStartDateChange = useCallback((value: string) => {
    setStartDate(value);
    if (value && duration > 0) {
      const newEndDate = addWorkingDays(parseISO(value), duration, holidays);
      setEndDate(format(newEndDate, 'yyyy-MM-dd'));
    }
  }, [duration, holidays]);

  const handleDurationChange = useCallback((value: number) => {
    setDuration(value);
    if (startDate && value > 0) {
      const newEndDate = addWorkingDays(parseISO(startDate), value, holidays);
      setEndDate(format(newEndDate, 'yyyy-MM-dd'));
    }
  }, [startDate, holidays]);

  const handleEndDateChange = useCallback((value: string) => {
    setEndDate(value);
    if (startDate && value) {
      const workingDays = countWorkingDays(parseISO(startDate), parseISO(value), holidays);
      setDuration(Math.max(1, workingDays));
    }
  }, [startDate, holidays]);

  const handleSave = () => {
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      start_date: startDate || null,
      end_date: endDate || null,
      duration,
      progress,
      predecessors,
      assignees,
      effort_per_assignee: effortPerAssignee,
      is_milestone: isMilestone,
      parent_id: parentId
    });
  };

  const togglePredecessor = (taskId: string) => {
    setPredecessors(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const toggleAssignee = (memberId: string) => {
    setAssignees(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const availableTasks = useMemo(() => 
    tasks.filter(t => t.id !== task?.id),
    [tasks, task?.id]
  );

  const filteredParentTasks = useMemo(() => {
    if (!parentSearch) return availableTasks;
    const search = parentSearch.toLowerCase();
    return availableTasks.filter(t => t.name.toLowerCase().includes(search));
  }, [availableTasks, parentSearch]);

  const filteredPredecessorTasks = useMemo(() => {
    if (!predecessorSearch) return availableTasks;
    const search = predecessorSearch.toLowerCase();
    return availableTasks.filter(t => t.name.toLowerCase().includes(search));
  }, [availableTasks, predecessorSearch]);

  const selectedParentName = parentId 
    ? tasks.find(t => t.id === parentId)?.name 
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-4">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-[11px] font-semibold">
            {task?.id ? 'Sửa task' : 'Thêm task mới'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Row 1: Name */}
          <div>
            <Label className="text-[11px] font-medium text-foreground">Tên task *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên task"
              className="h-7 text-[11px] mt-0.5"
            />
          </div>

          {/* Row 2: Parent + Milestone */}
          <div className="grid grid-cols-[1fr,auto] gap-2">
            <div>
              <Label className="text-[11px] font-medium text-foreground">Task cha</Label>
              <Popover open={parentOpen} onOpenChange={setParentOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-between h-7 text-[11px] mt-0.5 font-normal"
                  >
                    <span className="truncate">
                      {selectedParentName || 'Không có'}
                    </span>
                    <ChevronDown className="w-3 h-3 ml-1 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0" align="start" onWheel={(e) => e.stopPropagation()}>
                  <div className="p-2 border-b">
                    <div className="flex items-center gap-1 px-2 border rounded-md">
                      <Search className="w-3 h-3 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Tìm task..."
                        value={parentSearch}
                        onChange={(e) => setParentSearch(e.target.value)}
                        className="flex-1 h-7 text-[11px] bg-transparent outline-none"
                      />
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto scrollbar-thin p-1">
                    {filteredParentTasks.length === 0 && parentSearch ? (
                      <div className="text-[11px] text-muted-foreground text-center py-2">
                        Không tìm thấy
                      </div>
                    ) : (
                      <>
                        <div
                          onClick={() => {
                            setParentId(null);
                            setParentOpen(false);
                          }}
                          className={cn(
                            "flex items-center gap-2 px-2 py-1.5 text-[11px] rounded cursor-pointer hover:bg-accent",
                            !parentId && "bg-accent"
                          )}
                        >
                          <Check className={cn("w-3 h-3", !parentId ? "opacity-100" : "opacity-0")} />
                          Không có (task gốc)
                        </div>
                        {filteredParentTasks.map(t => (
                          <div
                            key={t.id}
                            onClick={() => {
                              setParentId(t.id);
                              setParentOpen(false);
                            }}
                            className={cn(
                              "flex items-center gap-2 px-2 py-1.5 text-[11px] rounded cursor-pointer hover:bg-accent",
                              parentId === t.id && "bg-accent"
                            )}
                          >
                            <Check className={cn("w-3 h-3", parentId === t.id ? "opacity-100" : "opacity-0")} />
                            <span className="truncate">{t.name}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-end pb-0.5">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <Checkbox
                  checked={isMilestone}
                  onCheckedChange={(checked) => setIsMilestone(checked === true)}
                  className="h-4 w-4"
                />
                <span className="text-[11px] font-medium">Milestone</span>
              </label>
            </div>
          </div>

          {/* Row 3: Dates */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-[11px] font-medium text-foreground">Bắt đầu</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="h-7 text-[11px] mt-0.5"
              />
            </div>
            <div>
              <Label className="text-[11px] font-medium text-foreground">Kết thúc</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
                className="h-7 text-[11px] mt-0.5"
              />
            </div>
            <div>
              <Label className="text-[11px] font-medium text-foreground">Duration</Label>
              <Input
                type="number"
                min={1}
                value={duration}
                onChange={(e) => handleDurationChange(parseInt(e.target.value) || 1)}
                className="h-7 text-[11px] mt-0.5"
              />
            </div>
          </div>

          {/* Row 4: Progress + Effort */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[11px] font-medium text-foreground">Tiến độ</Label>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Input
                  type="range"
                  min={0}
                  max={100}
                  value={progress}
                  onChange={(e) => setProgress(parseInt(e.target.value))}
                  className="flex-1 h-7"
                />
                <span className="text-[11px] w-8 text-right">{progress}%</span>
              </div>
            </div>
            <div>
              <Label className="text-[11px] font-medium text-foreground">Effort/người</Label>
              <Input
                type="number"
                min={0}
                max={1}
                step={0.1}
                value={effortPerAssignee}
                onChange={(e) => setEffortPerAssignee(parseFloat(e.target.value) || 0)}
                className="h-7 text-[11px] mt-0.5"
              />
            </div>
          </div>

          {/* Row 5: Predecessors */}
          <div>
            <Label className="text-[11px] font-medium text-foreground">Tiền nhiệm (Predecessor)</Label>
            <Popover open={predecessorOpen} onOpenChange={setPredecessorOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-between h-7 text-[11px] mt-0.5 font-normal"
                >
                  <span className="truncate">
                    {predecessors.length > 0 
                      ? `${predecessors.length} task`
                      : 'Chọn...'}
                  </span>
                  <ChevronDown className="w-3 h-3 ml-1 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-0" align="start" onWheel={(e) => e.stopPropagation()}>
                <div className="p-2 border-b">
                  <div className="flex items-center gap-1 px-2 border rounded-md">
                    <Search className="w-3 h-3 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Tìm task..."
                      value={predecessorSearch}
                      onChange={(e) => setPredecessorSearch(e.target.value)}
                      className="flex-1 h-7 text-[11px] bg-transparent outline-none"
                    />
                  </div>
                </div>
                <div className="max-h-40 overflow-y-auto scrollbar-thin p-1">
                  {filteredPredecessorTasks.length === 0 ? (
                    <div className="text-[11px] text-muted-foreground text-center py-2">
                      Không tìm thấy
                    </div>
                  ) : (
                    filteredPredecessorTasks.map(t => (
                      <label
                        key={t.id}
                        className="flex items-center gap-2 px-2 py-1 text-[11px] hover:bg-secondary rounded cursor-pointer"
                      >
                        <Checkbox
                          checked={predecessors.includes(t.id)}
                          onCheckedChange={() => togglePredecessor(t.id)}
                        />
                        <span className="truncate">{t.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Row 6: Assignees */}
          <div>
            <Label className="text-[11px] font-medium text-foreground">Phân công</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-between h-7 text-[11px] mt-0.5 font-normal"
                >
                  <span className="truncate">
                    {assignees.length > 0
                      ? assignees.map(id => projectMembers.find(m => m.id === id)?.name?.split(' ').pop()).filter(Boolean).join(', ')
                      : 'Chọn thành viên...'}
                  </span>
                  <ChevronDown className="w-3 h-3 ml-1 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-1" align="start" onWheel={(e) => e.stopPropagation()}>
                <div className="max-h-32 overflow-y-auto scrollbar-thin">
                  {projectMembers.length === 0 ? (
                    <div className="text-[11px] text-muted-foreground text-center py-2">
                      Chưa có thành viên active
                    </div>
                  ) : (
                    projectMembers.map(m => (
                      <label
                        key={m.id}
                        className="flex items-center gap-2 px-2 py-1 text-[11px] hover:bg-secondary rounded cursor-pointer"
                      >
                        <Checkbox
                          checked={assignees.includes(m.id)}
                          onCheckedChange={() => toggleAssignee(m.id)}
                        />
                        {m.name}
                      </label>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter className="pt-3">
          <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button size="sm" className="h-7 text-[11px]" onClick={handleSave} disabled={!name.trim()}>
            {task?.id ? 'Cập nhật' : 'Thêm'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
