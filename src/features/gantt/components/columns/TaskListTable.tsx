import { useState, useRef, useEffect, useCallback } from 'react';
import type { Task, TaskStatus, TaskLabel } from '../../types/gantt.types';
import { CustomColumn } from '../../types/gantt.types';
import {
  Button,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Calendar,
  Checkbox,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
} from '../internal/ui';
import { cn } from '../internal/utils';
import { ChevronRight, ChevronDown, Plus, MoreHorizontal, Trash2, Edit2, Settings2, Milestone, CalendarIcon, Copy, ArrowUp, ArrowDown, ArrowUpToLine, ArrowDownToLine, Bold, Italic } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { StatusSettingsDialog } from '../dialogs/StatusSettingsDialog';
import { LabelSettingsDialog } from '../dialogs/LabelSettingsDialog';

interface TaskGridProps {
  tasks: Task[];
  tasks_raw: Task[];
  columns: CustomColumn[];
  projectMembers: { id: string; name: string }[];
  allEmployees: { id: string; name: string }[];
  selectedTaskId: string | null;
  selectedTaskIds: Set<string>;
  taskIdMap: Map<string, number>;
  wbsMap: Map<string, string>;
  taskByIdNumber: Map<number, Task>;
  taskStatuses: TaskStatus[];
  taskLabels: TaskLabel[];
  projectId: string;
  onSelectTask: (taskId: string | null, ctrlKey?: boolean) => void;
  onToggleExpand: (taskId: string) => void;
  onAddTask: (parentId?: string | null, afterTaskId?: string | null) => void;
  onInsertAbove: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onCopyTask: (taskId: string) => void;
  onMoveUp: (taskId: string) => void;
  onMoveDown: (taskId: string) => void;
  onUpdateField: (taskId: string, field: string, value: any) => void;
  onColumnsChange: (columns: CustomColumn[]) => void;
  onVerticalScroll?: (scrollTop: number) => void;
  contentRef?: React.RefObject<HTMLDivElement>;
}

export function TaskGrid({
  tasks,
  tasks_raw,
  columns,
  projectMembers,
  allEmployees,
  selectedTaskId,
  selectedTaskIds,
  taskIdMap,
  wbsMap,
  taskByIdNumber,
  taskStatuses,
  taskLabels,
  projectId,
  onSelectTask,
  onToggleExpand,
  onAddTask,
  onInsertAbove,
  onEditTask,
  onDeleteTask,
  onCopyTask,
  onMoveUp,
  onMoveDown,
  onUpdateField,
  onColumnsChange,
  onVerticalScroll,
  contentRef
}: TaskGridProps) {
  const [editingCell, setEditingCell] = useState<{ taskId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState<{ taskId: string; field: string } | null>(null);
  const [assigneePopoverOpen, setAssigneePopoverOpen] = useState<string | null>(null);
  const [actionPopoverOpen, setActionPopoverOpen] = useState<string | null>(null);
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollableHeaderRef = useRef<HTMLDivElement>(null);
  const scrollableContentRef = useRef<HTMLDivElement>(null);

  // Handle column resize
  const handleResizeStart = useCallback((e: React.MouseEvent, colId: string, currentWidth: number) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColumn(colId);
    setResizeStartX(e.clientX);
    setResizeStartWidth(currentWidth);
  }, []);

  useEffect(() => {
    if (!resizingColumn) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - resizeStartX;
      const newWidth = Math.max(40, resizeStartWidth + delta); // Minimum width 40px
      
      onColumnsChange(columns.map(col => 
        col.id === resizingColumn ? { ...col, width: newWidth } : col
      ));
    };

    const handleMouseUp = () => {
      setResizingColumn(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingColumn, resizeStartX, resizeStartWidth, columns, onColumnsChange]);

  const hasChildren = (taskId: string) => {
    return tasks_raw.some(t => t.parent_id === taskId);
  };

  // Separate fixed and scrollable columns
  const fixedColumns = columns.filter(c => c.visible && c.fixed);
  const scrollableColumns = columns.filter(c => c.visible && !c.fixed);
  const fixedWidth = fixedColumns.reduce((sum, col) => sum + col.width, 0) + 40; // +40 for actions
  const scrollableWidth = scrollableColumns.reduce((sum, col) => sum + col.width, 0);

  const startEdit = (taskId: string, field: string, value: any) => {
    setEditingCell({ taskId, field });
    setEditValue(value?.toString() || '');
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 50);
  };

  const saveEdit = () => {
    if (!editingCell) return;
    
    let value: any = editValue;
    if (editingCell.field === 'duration' || editingCell.field === 'progress') {
      value = parseInt(editValue) || 0;
    } else if (editingCell.field === 'effort_per_assignee') {
      value = Math.min(1, Math.max(0, parseFloat(editValue) || 0));
    } else if (editingCell.field === 'predecessors') {
      const ids = editValue.split(/[,;\s]+/).filter(Boolean);
      value = ids.map(idStr => {
        const idNum = parseInt(idStr.trim());
        const task = taskByIdNumber.get(idNum);
        return task?.id;
      }).filter(Boolean);
    }
    
    onUpdateField(editingCell.taskId, editingCell.field, value);
    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      saveEdit();
    }
  };

  const getFieldValue = (task: Task, field: string) => {
    if (field === 'name') return task.name;
    if (field === 'start_date') return task.start_date || '';
    if (field === 'end_date') return task.end_date || '';
    if (field === 'duration') return task.duration;
    if (field === 'progress') return task.progress;
    if (field === 'effort' || field === 'effort_per_assignee') return task.effort_per_assignee;
    if (field === 'predecessors') return getPredecessorIds(task.predecessors);
    return '';
  };

  const getAssigneeNames = (assignees: string[]) => {
    if (!assignees?.length) return '-';
    return assignees.map(id => {
      const emp = allEmployees.find(e => e.id === id);
      return emp?.name?.split(' ').pop() || id.slice(0, 4);
    }).join(', ');
  };

  const getPredecessorIds = (predecessors: string[]) => {
    if (!predecessors?.length) return '';
    return predecessors.map(id => {
      const taskId = taskIdMap.get(id);
      return taskId || '';
    }).filter(Boolean).join(', ');
  };

  const getPredecessorDisplay = (predecessors: string[]) => {
    if (!predecessors?.length) return '-';
    return predecessors.map(id => {
      const taskId = taskIdMap.get(id);
      return taskId || '';
    }).filter(Boolean).join(', ');
  };

  const handleDateSelect = (taskId: string, field: string, date: Date | undefined) => {
    if (date) {
      onUpdateField(taskId, field, format(date, 'yyyy-MM-dd'));
    }
    setDatePickerOpen(null);
  };

  const handleAssigneeToggle = (taskId: string, employeeId: string, currentAssignees: string[]) => {
    const newAssignees = currentAssignees.includes(employeeId)
      ? currentAssignees.filter(id => id !== employeeId)
      : [...currentAssignees, employeeId];
    onUpdateField(taskId, 'assignees', newAssignees);
  };

  // Sync horizontal scroll between header and content for scrollable section
  const handleScrollableContentScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (scrollableHeaderRef.current) {
      scrollableHeaderRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
    // Sync vertical scroll with Gantt
    onVerticalScroll?.(e.currentTarget.scrollTop);
  };

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  // Render a cell content
  const renderCellContent = (task: Task, col: CustomColumn, isEditing: boolean) => {
    const isDateField = col.id === 'start_date' || col.id === 'end_date';
    const isAssigneesField = col.id === 'assignees';
    
    // Get text style classes for this task
    const isBold = task.text_style === 'bold' || task.text_style === 'bold-italic';
    const isItalic = task.text_style === 'italic' || task.text_style === 'bold-italic';
    const textStyleClasses = cn(isBold && 'font-bold', isItalic && 'italic');

    // Date picker cells
    if (isDateField) {
      const dateValue = col.id === 'start_date' ? task.start_date : task.end_date;
      return (
        <Popover 
          open={datePickerOpen?.taskId === task.id && datePickerOpen?.field === col.id}
          onOpenChange={(open) => {
            if (open) {
              setDatePickerOpen({ taskId: task.id, field: col.id });
            } else {
              setDatePickerOpen(null);
            }
          }}
        >
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn("h-5 w-full justify-start text-[11px] p-0.5 hover:bg-secondary/50", textStyleClasses)}
            >
              <CalendarIcon className="w-3 h-3 mr-1 opacity-50" />
              {dateValue ? format(parseISO(dateValue), 'dd/MM/yy') : '-'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateValue ? parseISO(dateValue) : undefined}
              onSelect={(date) => handleDateSelect(task.id, col.id, date)}
              defaultMonth={dateValue ? parseISO(dateValue) : undefined}
              initialFocus
              locale={vi}
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      );
    }

    // Status dropdown
    if (col.id === 'status') {
      const currentStatus = taskStatuses.find(s => s.name.toLowerCase().replace(/\s+/g, '_') === (task as any).status) 
        || taskStatuses.find(s => s.name === 'To Do');
      
      return (
        <Select
          value={(task as any).status || 'todo'}
          onValueChange={(value) => onUpdateField(task.id, 'status', value)}
          onOpenChange={() => onSelectTask(task.id)}
        >
          <SelectTrigger 
            className="h-5 w-full text-[11px] px-1 border-0 bg-transparent hover:bg-secondary/50"
            onClick={(e) => {
              e.stopPropagation();
              onSelectTask(task.id);
            }}
          >
            <div className="flex items-center gap-1 truncate">
              <div 
                className="w-2 h-2 rounded-full shrink-0" 
                style={{ backgroundColor: currentStatus?.color || '#6B7280' }}
              />
              <span className="truncate">{currentStatus?.name || (task as any).status || 'To Do'}</span>
            </div>
          </SelectTrigger>
          <SelectContent>
            {taskStatuses.map(status => (
              <SelectItem 
                key={status.id} 
                value={status.name.toLowerCase().replace(/\s+/g, '_')}
                className="text-xs"
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: status.color }}
                  />
                  {status.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // Label dropdown
    if (col.id === 'label') {
      const currentLabel = taskLabels.find(l => l.id === task.label_id) 
        || taskLabels.find(l => l.is_default);
      
      return (
        <Select
          value={task.label_id || 'default'}
          onValueChange={(value) => onUpdateField(task.id, 'label_id', value === 'default' ? null : value)}
          onOpenChange={() => onSelectTask(task.id)}
        >
          <SelectTrigger 
            className="h-5 w-full text-[11px] px-1 border-0 bg-transparent hover:bg-secondary/50"
            onClick={(e) => {
              e.stopPropagation();
              onSelectTask(task.id);
            }}
          >
            <div className="flex items-center gap-1 truncate">
              <div 
                className="w-2 h-2 rounded-full shrink-0" 
                style={{ backgroundColor: currentLabel?.color || '#3b82f6' }}
              />
              <span className="truncate">{currentLabel?.name || 'Default'}</span>
            </div>
          </SelectTrigger>
          <SelectContent>
            {taskLabels.map(label => (
              <SelectItem 
                key={label.id} 
                value={label.id}
                className="text-xs"
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: label.color }}
                  />
                  {label.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // Assignees multi-select
    if (isAssigneesField) {
      return (
        <Popover 
          open={assigneePopoverOpen === task.id}
          onOpenChange={(open) => setAssigneePopoverOpen(open ? task.id : null)}
        >
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn("h-5 w-full justify-start text-[11px] p-0.5 hover:bg-secondary/50 truncate", textStyleClasses)}
            >
              {getAssigneeNames(task.assignees)}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="start">
            <div className="text-xs font-medium mb-2">Assign</div>
            <div className="max-h-48 overflow-y-auto scrollbar-thin space-y-1">
              {projectMembers.length > 0 ? (
                projectMembers.map(member => (
                  <label key={member.id} className="flex items-center gap-2 py-1 text-xs cursor-pointer hover:bg-secondary/50 rounded px-1">
                    <Checkbox
                      checked={task.assignees?.includes(member.id) || false}
                      onCheckedChange={() => handleAssigneeToggle(task.id, member.id, task.assignees || [])}
                    />
                    {member.name}
                  </label>
                ))
              ) : (
                <div className="text-xs text-muted-foreground">Chưa có thành viên</div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      );
    }

    // Editable text/number fields
    if (isEditing) {
      return (
        <Input
          ref={inputRef}
          type={col.id === 'duration' || col.id === 'progress' || col.id === 'effort' ? 'number' : 'text'}
          min={col.id === 'effort' ? 0 : undefined}
          max={col.id === 'effort' ? 1 : undefined}
          step={col.id === 'effort' ? '0.1' : undefined}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={saveEdit}
          onKeyDown={handleKeyDown}
          className="h-5 !text-[11px] px-1"
          onClick={(e) => e.stopPropagation()}
        />
      );
    }

    // Read-only display
    if (col.id === 'task_id') {
      return <span className="text-muted-foreground">{taskIdMap.get(task.id)}</span>;
    }
    if (col.id === 'wbs') {
      const wbsValue = wbsMap?.get(task.id) || '';
      const indentLevel = (task.level || 0) * 4;
      return (
        <span className={cn("flex items-center", textStyleClasses)}>
          <span style={{ width: indentLevel, flexShrink: 0 }} />
          {wbsValue}
        </span>
      );
    }
    if (col.id === 'name') {
      const isGroup = hasChildren(task.id);
      const indentWidth = (task.level || 0) * 12;
      return (
        <div className={cn("flex items-center", !isGroup && "gap-1")}>
          <div style={{ width: isGroup ? indentWidth - 6 : indentWidth }} />
          {isGroup && (
            <button
              className="p-0.5 hover:bg-secondary rounded"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand(task.id);
              }}
            >
              {task.isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
          )}
          <span className={cn(isGroup && !isBold && 'font-medium', textStyleClasses)}>
            {task.name}
          </span>
        </div>
      );
    }
    if (col.id === 'duration') {
      return `${task.duration}d`;
    }
    if (col.id === 'progress') {
      return (
        <div className="flex items-center gap-1">
          <div className="flex-1 h-1.5 bg-secondary rounded overflow-hidden">
            <div 
              className="h-full bg-primary rounded" 
              style={{ width: `${task.progress}%` }}
            />
          </div>
          <span className="text-[9px] text-muted-foreground">{task.progress}%</span>
        </div>
      );
    }
    if (col.id === 'predecessors') {
      return getPredecessorDisplay(task.predecessors);
    }
    if (col.id === 'effort') {
      return (
        <span 
          className="cursor-pointer hover:bg-secondary/50 px-1 rounded w-full inline-block text-center"
          onClick={(e) => {
            e.stopPropagation();
            onSelectTask(task.id); // Select row while editing
            startEdit(task.id, 'effort_per_assignee', task.effort_per_assignee || 0);
          }}
        >
          {task.effort_per_assignee > 0 ? task.effort_per_assignee : '-'}
        </span>
      );
    }
    return null;
  };

  return (
    <div className="border-r border-border flex flex-col h-full overflow-hidden">
      {/* Header row */}
      <div className="flex bg-secondary/50 border-b border-border text-[11px] font-semibold shrink-0" style={{ height: 42 }}>
        {/* Fixed header section */}
        <div className="flex shrink-0 items-stretch" style={{ width: fixedWidth }}>
          <div className="w-[40px] min-w-[40px] px-1 flex items-center justify-center border-r border-border/50">
            <Popover open={showColumnSettings} onOpenChange={setShowColumnSettings}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                  <Settings2 className="w-3 h-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" align="start">
                <div className="text-xs font-medium mb-2">Hiển thị cột</div>
                {columns.map(col => {
                  // task_id và name không thể tắt, các cột khác có thể toggle
                  const isNonToggleable = col.id === 'task_id' || col.id === 'name';
                  return (
                    <label key={col.id} className="flex items-center gap-2 py-1 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={col.visible}
                        disabled={isNonToggleable}
                        onChange={(e) => {
                          onColumnsChange(columns.map(c => 
                            c.id === col.id ? { ...c, visible: e.target.checked } : c
                          ));
                        }}
                        className="rounded"
                      />
                      {col.name} {isNonToggleable && <span className="text-muted-foreground">(cố định)</span>}
                    </label>
                  );
                })}
              </PopoverContent>
            </Popover>
          </div>
          {fixedColumns.map(col => (
            <div
              key={col.id}
              className="relative px-1.5 truncate border-r border-border/50 flex items-center justify-center group"
              style={{ width: col.width, minWidth: col.width }}
            >
              {col.name}
              {/* Resize handle */}
              <div
                className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 opacity-0 group-hover:opacity-100 transition-opacity"
                onMouseDown={(e) => handleResizeStart(e, col.id, col.width)}
              />
            </div>
          ))}
        </div>

        {/* Scrollable header section */}
        <div 
          ref={scrollableHeaderRef}
          className="flex-1 overflow-hidden flex items-stretch"
        >
          <div className="flex items-stretch" style={{ minWidth: scrollableWidth }}>
            {scrollableColumns.map(col => (
              <div
                key={col.id}
                className="relative px-1.5 truncate border-r border-border/50 flex items-center justify-center gap-1 group"
                style={{ width: col.width, minWidth: col.width }}
              >
                {col.name}
                {col.id === 'status' && (
                  <StatusSettingsDialog projectId={projectId} />
                )}
                {col.id === 'label' && (
                  <LabelSettingsDialog projectId={projectId} />
                )}
                {/* Resize handle */}
                <div
                  className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 opacity-0 group-hover:opacity-100 transition-opacity"
                  onMouseDown={(e) => handleResizeStart(e, col.id, col.width)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scrollable content wrapper - horizontal scroll at bottom */}
      <div 
        ref={contentRef || scrollableContentRef}
        className="flex-1 overflow-auto scrollbar-thin"
        onScroll={handleScrollableContentScroll}
      >
        <div className="flex" style={{ minWidth: fixedWidth + scrollableWidth }}>
          {/* Fixed columns container */}
          <div 
            className="shrink-0 sticky left-0 z-10 bg-card"
            style={{ width: fixedWidth }}
          >
            {tasks.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-xs">
                Chưa có task nào. Nhấn "Thêm task" để bắt đầu.
              </div>
            ) : (
              tasks.map((task, idx) => {
                const isBold = task.text_style === 'bold' || task.text_style === 'bold-italic';
                const isItalic = task.text_style === 'italic' || task.text_style === 'bold-italic';
                const textStyleClasses = cn(
                  isBold && 'font-bold',
                  isItalic && 'italic'
                );
                return (
                <div
                  key={task.id}
                  className={cn(
                    'flex border-b border-border/50 text-[11px] hover:bg-secondary/30 cursor-pointer',
                    selectedTaskIds.has(task.id) ? 'bg-sky-500/15' : (idx % 2 === 0 ? 'bg-card' : 'bg-secondary/10'),
                    textStyleClasses
                  )}
                  style={{ height: 28 }}
                  onClick={(e) => onSelectTask(task.id, e.ctrlKey || e.metaKey)}
                >
                  {/* Actions */}
                  <div className="w-[40px] min-w-[40px] px-1 flex items-center gap-0.5 justify-center border-r border-border/30">
                    <Popover open={actionPopoverOpen === task.id} onOpenChange={(open) => setActionPopoverOpen(open ? task.id : null)}>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={(e) => e.stopPropagation()}>
                          <MoreHorizontal className="w-3 h-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-40 p-1" align="start">
                        {/* Insert actions */}
                        <button
                          className="w-full flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-secondary rounded"
                          onClick={(e) => { e.stopPropagation(); setActionPopoverOpen(null); onInsertAbove(task.id); }}
                        >
                          <ArrowUpToLine className="w-3 h-3" /> Chèn phía trên
                        </button>
                        <button
                          className="w-full flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-secondary rounded"
                          onClick={(e) => { e.stopPropagation(); setActionPopoverOpen(null); onAddTask(null, task.id); }}
                        >
                          <ArrowDownToLine className="w-3 h-3" /> Chèn phía dưới
                        </button>
                        <button
                          className="w-full flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-secondary rounded"
                          onClick={(e) => { e.stopPropagation(); setActionPopoverOpen(null); onAddTask(task.id); }}
                        >
                          <Plus className="w-3 h-3" /> Thêm task con
                        </button>
                        
                        <Separator className="my-1" />
                        
                        {/* Copy action */}
                        <button
                          className="w-full flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-secondary rounded"
                          onClick={(e) => { e.stopPropagation(); setActionPopoverOpen(null); onCopyTask(task.id); }}
                        >
                          <Copy className="w-3 h-3" /> Copy
                        </button>
                        
                        <Separator className="my-1" />
                        
                        {/* Text style actions */}
                        <button
                          className={cn(
                            "w-full flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-secondary rounded",
                            isBold && "bg-secondary"
                          )}
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            const newStyle = isBold 
                              ? (isItalic ? 'italic' : null)
                              : (isItalic ? 'bold-italic' : 'bold');
                            onUpdateField(task.id, 'text_style', newStyle);
                          }}
                        >
                          <Bold className="w-3 h-3" /> Bold
                        </button>
                        <button
                          className={cn(
                            "w-full flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-secondary rounded",
                            isItalic && "bg-secondary"
                          )}
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            const newStyle = isItalic 
                              ? (isBold ? 'bold' : null)
                              : (isBold ? 'bold-italic' : 'italic');
                            onUpdateField(task.id, 'text_style', newStyle);
                          }}
                        >
                          <Italic className="w-3 h-3" /> Italic
                        </button>
                        
                        <Separator className="my-1" />
                        
                        {/* Move actions */}
                        <button
                          className="w-full flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-secondary rounded"
                          onClick={(e) => { e.stopPropagation(); setActionPopoverOpen(null); onMoveUp(task.id); }}
                        >
                          <ArrowUp className="w-3 h-3" /> Di chuyển lên
                        </button>
                        <button
                          className="w-full flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-secondary rounded"
                          onClick={(e) => { e.stopPropagation(); setActionPopoverOpen(null); onMoveDown(task.id); }}
                        >
                          <ArrowDown className="w-3 h-3" /> Di chuyển xuống
                        </button>
                        
                        <Separator className="my-1" />
                        
                        {/* Delete action */}
                        <button
                          className="w-full flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-secondary rounded text-destructive"
                          onClick={(e) => { e.stopPropagation(); setActionPopoverOpen(null); onDeleteTask(task.id); }}
                        >
                          <Trash2 className="w-3 h-3" /> Xóa
                        </button>
                      </PopoverContent>
                    </Popover>
                    {task.is_milestone && <Milestone className="w-3 h-3 text-amber-500" />}
                  </div>

                  {/* Fixed columns */}
                  {fixedColumns.map(col => {
                    const fieldName = col.id === 'effort' ? 'effort_per_assignee' : col.id;
                    const isEditing = editingCell?.taskId === task.id && editingCell?.field === fieldName;
                    const isEditable = col.id !== 'task_id' && col.id !== 'wbs';
                    return (
                      <div
                        key={col.id}
                        className={cn(
                          'px-1.5 truncate border-r border-border/30 flex items-center',
                          isEditable && 'hover:bg-secondary/50 cursor-text'
                        )}
                        style={{ width: col.width, minWidth: col.width, height: '100%' }}
                        onClick={(e) => {
                          if (isEditable && col.id !== 'start_date' && col.id !== 'end_date' && col.id !== 'assignees') {
                            e.stopPropagation();
                            onSelectTask(task.id); // Select row while editing
                            const fieldName = col.id === 'effort' ? 'effort_per_assignee' : col.id;
                            startEdit(task.id, fieldName, getFieldValue(task, col.id));
                          }
                        }}
                      >
                      {renderCellContent(task, col, isEditing)}
                    </div>
                  );
                })}
                </div>
              );
              })
            )}
          </div>

          {/* Scrollable columns container */}
          <div style={{ minWidth: scrollableWidth }}>
            {tasks.length > 0 && tasks.map((task, idx) => {
              const isBoldScrollable = task.text_style === 'bold' || task.text_style === 'bold-italic';
              const isItalicScrollable = task.text_style === 'italic' || task.text_style === 'bold-italic';
              const textStyleScrollableClasses = cn(
                isBoldScrollable && 'font-bold',
                isItalicScrollable && 'italic'
              );
              return (
              <div
                key={task.id}
                className={cn(
                  'flex border-b border-border/50 text-[11px] hover:bg-secondary/30 cursor-pointer',
                  selectedTaskIds.has(task.id) ? 'bg-sky-500/15' : (idx % 2 === 0 ? 'bg-card' : 'bg-secondary/10'),
                  textStyleScrollableClasses
                )}
                style={{ height: 28 }}
                onClick={(e) => onSelectTask(task.id, e.ctrlKey || e.metaKey)}
              >
                {scrollableColumns.map(col => {
                  const fieldName = col.id === 'effort' ? 'effort_per_assignee' : col.id;
                  const isEditing = editingCell?.taskId === task.id && editingCell?.field === fieldName;
                  const isDateField = col.id === 'start_date' || col.id === 'end_date';
                  const isAssigneesField = col.id === 'assignees';
                  const isEditable = !isDateField && !isAssigneesField;
                  return (
                    <div
                      key={col.id}
                      className={cn(
                        'px-1.5 truncate border-r border-border/30 flex items-center',
                        isEditable && 'hover:bg-secondary/50 cursor-text'
                      )}
                      style={{ width: col.width, minWidth: col.width, height: '100%' }}
                      onClick={(e) => {
                        if (isEditable) {
                          e.stopPropagation();
                          onSelectTask(task.id); // Select row while editing
                          const fieldName = col.id === 'effort' ? 'effort_per_assignee' : col.id;
                          startEdit(task.id, fieldName, getFieldValue(task, col.id));
                        }
                      }}
                    >
                      {renderCellContent(task, col, isEditing)}
                    </div>
                  );
                })}
              </div>
            );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
