import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Task } from '../../types/task.types';
import { TaskStatus } from '../../types/task.types';
import { TaskLabel } from '../../types/task.types';
import { CustomColumn } from '../../types/gantt.types';
import { Button, Input, Popover, PopoverContent, PopoverTrigger } from '../internal/ui';
import { cn } from '../internal/utils';
import { ChevronRight, ChevronDown, MoreHorizontal, Settings2, Milestone } from 'lucide-react';
import { format } from 'date-fns';
import { StatusSettingsDialog } from '../dialogs/StatusSettingsDialog';
import { LabelSettingsDialog } from '../dialogs/LabelSettingsDialog';

// Import các component đã tách
import { TaskGridActions } from './TaskGridActions';
import DateCell from './cell/DateCell';
import StatusCell from './cell/StatusCell';
import LabelCell from './cell/LabelCell';
import AssigneeCell from './cell/AssigneeCell';

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

export const TaskGrid = ({
  tasks, tasks_raw, columns, projectMembers, allEmployees, selectedTaskIds,
  taskIdMap, wbsMap, taskByIdNumber, taskStatuses, taskLabels, projectId,
  onSelectTask, onToggleExpand, onUpdateField, onColumnsChange, onVerticalScroll, contentRef,
  onAddTask, onInsertAbove, onCopyTask, onMoveUp, onMoveDown, onDeleteTask
}: TaskGridProps) => {

  // State
  const [editingCell, setEditingCell] = useState<{ taskId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState<{ taskId: string; field: string } | null>(null);
  const [assigneePopoverOpen, setAssigneePopoverOpen] = useState<string | null>(null);
  const [actionPopoverOpen, setActionPopoverOpen] = useState<string | null>(null);
  
  // Resize State
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollableHeaderRef = useRef<HTMLDivElement>(null);
  const scrollableContentRef = useRef<HTMLDivElement>(null);

  // --- Resize Logic ---
  const handleResizeStart = useCallback((e: React.MouseEvent, colId: string, currentWidth: number) => {
    e.preventDefault(); e.stopPropagation();
    setResizingColumn(colId); setResizeStartX(e.clientX); setResizeStartWidth(currentWidth);
  }, []);

  useEffect(() => {
    if (!resizingColumn) return;
    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - resizeStartX;
      const newWidth = Math.max(40, resizeStartWidth + delta);
      onColumnsChange(columns.map(col => col.id === resizingColumn ? { ...col, width: newWidth } : col));
    };
    const handleMouseUp = () => setResizingColumn(null);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingColumn, resizeStartX, resizeStartWidth, columns, onColumnsChange]);

  // --- Helpers ---
  const hasChildren = (taskId: string) => tasks_raw.some(t => t.parent_id === taskId);
  
  const fixedColumns = useMemo(() => columns.filter(c => c.visible && c.fixed), [columns]);
  const scrollableColumns = useMemo(() => columns.filter(c => c.visible && !c.fixed), [columns]);
  
  const fixedWidth = useMemo(() => fixedColumns.reduce((sum, col) => sum + col.width, 0) + 40, [fixedColumns]);
  const scrollableWidth = useMemo(() => scrollableColumns.reduce((sum, col) => sum + col.width, 0), [scrollableColumns]);

  const getFieldValue = (task: Task, field: string) => {
    if (field === 'name') return task.name;
    if (field === 'duration') return task.duration;
    if (field === 'progress') return task.progress;
    if (field === 'effort' || field === 'effort_per_assignee') return task.effort_per_assignee;
    if (field === 'predecessors') return task.predecessors?.map(id => taskIdMap.get(id) || '').filter(Boolean).join(', ') || '';
    return '';
  };

  // --- Editing Logic ---
  const startEdit = (taskId: string, field: string, value: any) => {
    setEditingCell({ taskId, field });
    setEditValue(value?.toString() || '');
    setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select(); }, 50);
  };

  const saveEdit = () => {
    if (!editingCell) return;
    let value: any = editValue;
    if (['duration', 'progress'].includes(editingCell.field)) value = parseInt(editValue) || 0;
    else if (editingCell.field === 'effort_per_assignee') value = Math.min(1, Math.max(0, parseFloat(editValue) || 0));
    else if (editingCell.field === 'predecessors') {
      value = editValue.split(/[,;\s]+/).filter(Boolean).map(idStr => taskByIdNumber.get(parseInt(idStr.trim()))?.id).filter(Boolean);
    }
    onUpdateField(editingCell.taskId, editingCell.field, value);
    setEditingCell(null);
  };

  const handleScrollableContentScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (scrollableHeaderRef.current) scrollableHeaderRef.current.scrollLeft = e.currentTarget.scrollLeft;
    onVerticalScroll?.(e.currentTarget.scrollTop);
  };

  // --- MAIN RENDER LOGIC: STRATEGY PATTERN ---
  const renderCellContent = (task: Task, col: CustomColumn, isEditing: boolean) => {
    // 1. Nếu đang edit, render Input
    if (isEditing) {
      return (
        <Input 
          ref={inputRef} 
          type={['duration', 'progress', 'effort'].includes(col.id) ? 'number' : 'text'}
          value={editValue} 
          onChange={(e) => setEditValue(e.target.value)} 
          onBlur={saveEdit}
          onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); else if (e.key === 'Escape') setEditingCell(null); }}
          className="h-5 !text-[11px] px-1" 
          onClick={(e) => e.stopPropagation()} 
        />
      );
    }

    // Prepare text styles
    const isBold = task.text_style === 'bold' || task.text_style === 'bold-italic';
    const isItalic = task.text_style === 'italic' || task.text_style === 'bold-italic';
    const textStyleClasses = cn(isBold && 'font-bold', isItalic && 'italic');

    // 2. Định nghĩa Render Map (Strategy Pattern)
    // Map ID cột -> Hàm trả về JSX
    const renderers: Record<string, () => React.ReactNode> = {
      // --- Special Date Fields ---
      start_date: () => (
        <DateCell 
          value={task.start_date} 
          taskId={task.id} 
          field="start_date" 
          isOpen={datePickerOpen?.taskId === task.id && datePickerOpen?.field === 'start_date'}
          onOpenChange={(open) => setDatePickerOpen(open ? { taskId: task.id, field: 'start_date' } : null)}
          onSelect={(tid, f, date) => { onUpdateField(tid, f, format(date, 'yyyy-MM-dd')); setDatePickerOpen(null); }}
          textStyleClasses={textStyleClasses} 
        />
      ),
      end_date: () => (
        <DateCell 
          value={task.end_date} 
          taskId={task.id} 
          field="end_date" 
          isOpen={datePickerOpen?.taskId === task.id && datePickerOpen?.field === 'end_date'}
          onOpenChange={(open) => setDatePickerOpen(open ? { taskId: task.id, field: 'end_date' } : null)}
          onSelect={(tid, f, date) => { onUpdateField(tid, f, format(date, 'yyyy-MM-dd')); setDatePickerOpen(null); }}
          textStyleClasses={textStyleClasses} 
        />
      ),
      
      // --- Dropdown/Select Fields ---
      status: () => (
        <StatusCell 
          statusValue={(task as any).status} 
          taskStatuses={taskStatuses} 
          onUpdate={(v) => onUpdateField(task.id, 'status', v)} 
          onSelectTask={() => onSelectTask(task.id)} 
        />
      ),
      label: () => (
        <LabelCell 
          labelId={task.label_id || null} 
          taskLabels={taskLabels} 
          onUpdate={(v) => onUpdateField(task.id, 'label_id', v)} 
          onSelectTask={() => onSelectTask(task.id)} 
        />
      ),
      assignees: () => (
        <AssigneeCell 
          assignees={task.assignees} 
          projectMembers={projectMembers} 
          allEmployees={allEmployees}
          isOpen={assigneePopoverOpen === task.id} 
          onOpenChange={(open) => setAssigneePopoverOpen(open ? task.id : null)}
          onUpdate={(v) => onUpdateField(task.id, 'assignees', v)} 
          textStyleClasses={textStyleClasses} 
        />
      ),

      // --- Read-only / Simple Fields ---
      task_id: () => <span className="text-muted-foreground">{taskIdMap.get(task.id)}</span>,
      
      wbs: () => (
        <span className={cn("flex items-center", textStyleClasses)}>
          <span style={{ width: (task.level || 0) * 4 }} />
          {wbsMap?.get(task.id)}
        </span>
      ),

      name: () => {
        const isGroup = hasChildren(task.id);
        return (
          <div className={cn("flex items-center", !isGroup && "gap-1")}>
            <div style={{ width: isGroup ? ((task.level || 0) * 12) - 6 : (task.level || 0) * 12 }} />
            {isGroup && (
              <button 
                className="p-0.5 hover:bg-secondary rounded" 
                onClick={(e) => { e.stopPropagation(); onToggleExpand(task.id); }}
              >
                {task.isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </button>
            )}
            <span className={cn(isGroup && !isBold && 'font-medium', textStyleClasses)}>
              {task.name}
            </span>
          </div>
        );
      },

      duration: () => `${task.duration}d`,
      
      progress: () => (
        <div className="flex items-center gap-1">
          <div className="flex-1 h-1.5 bg-secondary rounded overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${task.progress}%` }} />
          </div>
          <span className="text-[9px] text-muted-foreground">{task.progress}%</span>
        </div>
      ),

      predecessors: () => task.predecessors?.map(id => taskIdMap.get(id) || '').filter(Boolean).join(', ') || '-',

      effort: () => (
        <span 
          className="cursor-pointer hover:bg-secondary/50 px-1 rounded w-full inline-block text-center" 
          onClick={(e) => { 
            e.stopPropagation(); 
            onSelectTask(task.id); 
            startEdit(task.id, 'effort_per_assignee', task.effort_per_assignee || 0); 
          }}
        >
          {task.effort_per_assignee > 0 ? task.effort_per_assignee : '-'}
        </span>
      )
    };

    // 3. Thực thi Renderer
    // Nếu có renderer cụ thể thì dùng, không thì trả về null hoặc giá trị mặc định
    return renderers[col.id] ? renderers[col.id]() : null;
  };

  // --- Render Column Logic (Reusable) ---
  const renderColumns = (targetColumns: CustomColumn[], task: Task) => targetColumns.map(col => {
    const fieldName = col.id === 'effort' ? 'effort_per_assignee' : col.id;
    const isEditing = editingCell?.taskId === task.id && editingCell?.field === fieldName;
    const isEditable = !['task_id', 'wbs', 'start_date', 'end_date', 'assignees'].includes(col.id);
    
    return (
      <div key={col.id} className={cn('px-1.5 truncate border-r border-border/30 flex items-center', isEditable && 'hover:bg-secondary/50 cursor-text')}
        style={{ width: col.width, minWidth: col.width, height: '100%' }}
        onClick={(e) => {
          if (isEditable) {
            e.stopPropagation(); onSelectTask(task.id);
            startEdit(task.id, fieldName, getFieldValue(task, col.id));
          }
        }}>
        {renderCellContent(task, col, isEditing)}
      </div>
    );
  });

  return (
    <div className="border-r border-border flex flex-col h-full overflow-hidden">
      {/* --- HEADER --- */}
      <div className="flex bg-secondary/50 border-b border-border text-[11px] font-semibold shrink-0" style={{ height: 42 }}>
        <div className="flex shrink-0 items-stretch" style={{ width: fixedWidth }}>
          <div className="w-[40px] min-w-[40px] px-1 flex items-center justify-center border-r border-border/50">
            <Popover open={showColumnSettings} onOpenChange={setShowColumnSettings}>
              <PopoverTrigger asChild><Button variant="ghost" size="sm" className="h-5 w-5 p-0"><Settings2 className="w-3 h-3" /></Button></PopoverTrigger>
              <PopoverContent className="w-48 p-2" align="start">
                <div className="text-xs font-medium mb-2">Hiển thị cột</div>
                {columns.map(col => (
                  <label key={col.id} className="flex items-center gap-2 py-1 text-xs cursor-pointer">
                    <input type="checkbox" checked={col.visible} disabled={['task_id', 'name'].includes(col.id)}
                      onChange={(e) => onColumnsChange(columns.map(c => c.id === col.id ? { ...c, visible: e.target.checked } : c))} className="rounded" />
                    {col.name} {['task_id', 'name'].includes(col.id) && <span className="text-muted-foreground">(cố định)</span>}
                  </label>
                ))}
              </PopoverContent>
            </Popover>
          </div>
          {fixedColumns.map(col => (
            <div key={col.id} className="relative px-1.5 truncate border-r border-border/50 flex items-center justify-center group" style={{ width: col.width, minWidth: col.width }}>
              {col.name}
              <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => handleResizeStart(e, col.id, col.width)} />
            </div>
          ))}
        </div>
        <div ref={scrollableHeaderRef} className="flex-1 overflow-hidden flex items-stretch">
          <div className="flex items-stretch" style={{ minWidth: scrollableWidth }}>
            {scrollableColumns.map(col => (
              <div key={col.id} className="relative px-1.5 truncate border-r border-border/50 flex items-center justify-center gap-1 group" style={{ width: col.width, minWidth: col.width }}>
                {col.name}
                {col.id === 'status' && <StatusSettingsDialog projectId={projectId} />}
                {col.id === 'label' && <LabelSettingsDialog projectId={projectId} />}
                <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 opacity-0 group-hover:opacity-100 transition-opacity" onMouseDown={(e) => handleResizeStart(e, col.id, col.width)} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- CONTENT --- */}
      <div ref={contentRef || scrollableContentRef} className="flex-1 overflow-auto scrollbar-thin" onScroll={handleScrollableContentScroll}>
        <div className="flex" style={{ minWidth: fixedWidth + scrollableWidth }}>
          {/* Fixed Columns Content */}
          <div className="shrink-0 sticky left-0 z-10 bg-card" style={{ width: fixedWidth }}>
            {tasks.length === 0 ? <div className="p-4 text-center text-muted-foreground text-xs">Chưa có task nào.</div> :
              tasks.map((task, idx) => {
                const textStyleClasses = cn((task.text_style === 'bold' || task.text_style === 'bold-italic') && 'font-bold', (task.text_style === 'italic' || task.text_style === 'bold-italic') && 'italic');
                return (
                  <div key={task.id} className={cn('flex border-b border-border/50 text-[11px] hover:bg-secondary/30 cursor-pointer', selectedTaskIds.has(task.id) ? 'bg-sky-500/15' : (idx % 2 === 0 ? 'bg-card' : 'bg-secondary/10'), textStyleClasses)}
                    style={{ height: 28 }} onClick={(e) => onSelectTask(task.id, e.ctrlKey || e.metaKey)}>
                    <div className="w-[40px] min-w-[40px] px-1 flex items-center gap-0.5 justify-center border-r border-border/30">
                      <Popover open={actionPopoverOpen === task.id} onOpenChange={(open) => setActionPopoverOpen(open ? task.id : null)}>
                        <PopoverTrigger asChild><Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={(e) => e.stopPropagation()}><MoreHorizontal className="w-3 h-3" /></Button></PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <TaskGridActions taskId={task.id} isMilestone={task.is_milestone} textStyle={task.text_style}
                            onInsertAbove={onInsertAbove} onAddTask={onAddTask} onCopyTask={onCopyTask}
                            onUpdateField={onUpdateField} onMoveUp={onMoveUp} onMoveDown={onMoveDown}
                            onDeleteTask={onDeleteTask} onClose={() => setActionPopoverOpen(null)} />
                        </PopoverContent>
                      </Popover>
                      {task.is_milestone && <Milestone className="w-3 h-3 text-amber-500" />}
                    </div>
                    {renderColumns(fixedColumns, task)}
                  </div>
                );
              })
            }
          </div>
          
          {/* Scrollable Columns Content */}
          <div style={{ minWidth: scrollableWidth }}>
            {tasks.length > 0 && tasks.map((task, idx) => {
               const textStyleClasses = cn((task.text_style === 'bold' || task.text_style === 'bold-italic') && 'font-bold', (task.text_style === 'italic' || task.text_style === 'bold-italic') && 'italic');
               return (
                <div key={task.id} className={cn('flex border-b border-border/50 text-[11px] hover:bg-secondary/30 cursor-pointer', selectedTaskIds.has(task.id) ? 'bg-sky-500/15' : (idx % 2 === 0 ? 'bg-card' : 'bg-secondary/10'), textStyleClasses)}
                  style={{ height: 28 }} onClick={(e) => onSelectTask(task.id, e.ctrlKey || e.metaKey)}>
                  {renderColumns(scrollableColumns, task)}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
export default TaskGrid;