import { 
    ArrowUpToLine, ArrowDownToLine, Plus, Copy, 
    Bold, Italic, ArrowUp, ArrowDown, Trash2, Milestone 
  } from 'lucide-react';
  import { Separator } from '../internal/ui';
  import { cn } from '../internal/utils';
  
  interface TaskGridActionsProps {
    taskId: string;
    isMilestone?: boolean;
    textStyle?: string;
    onInsertAbove: (id: string) => void;
    onAddTask: (parentId?: string | null, afterTaskId?: string | null) => void;
    onCopyTask: (id: string) => void;
    onUpdateField: (id: string, field: string, value: any) => void;
    onMoveUp: (id: string) => void;
    onMoveDown: (id: string) => void;
    onDeleteTask: (id: string) => void;
    onClose: () => void;
  }
  
  export function TaskGridActions({
    taskId,
    isMilestone,
    textStyle,
    onInsertAbove,
    onAddTask,
    onCopyTask,
    onUpdateField,
    onMoveUp,
    onMoveDown,
    onDeleteTask,
    onClose
  }: TaskGridActionsProps) {
    const isBold = textStyle === 'bold' || textStyle === 'bold-italic';
    const isItalic = textStyle === 'italic' || textStyle === 'bold-italic';
  
    const handleAction = (action: () => void) => {
      onClose();
      action();
    };
  
    return (
      <div className="w-40 p-1">
        {/* Insert actions */}
        <button className="w-full flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-secondary rounded"
          onClick={(e) => { e.stopPropagation(); handleAction(() => onInsertAbove(taskId)); }}>
          <ArrowUpToLine className="w-3 h-3" /> Chèn phía trên
        </button>
        <button className="w-full flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-secondary rounded"
          onClick={(e) => { e.stopPropagation(); handleAction(() => onAddTask(null, taskId)); }}>
          <ArrowDownToLine className="w-3 h-3" /> Chèn phía dưới
        </button>
        <button className="w-full flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-secondary rounded"
          onClick={(e) => { e.stopPropagation(); handleAction(() => onAddTask(taskId)); }}>
          <Plus className="w-3 h-3" /> Thêm task con
        </button>
  
        <Separator className="my-1" />
  
        {/* Copy action */}
        <button className="w-full flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-secondary rounded"
          onClick={(e) => { e.stopPropagation(); handleAction(() => onCopyTask(taskId)); }}>
          <Copy className="w-3 h-3" /> Copy
        </button>
  
        <Separator className="my-1" />
  
        {/* Text style actions */}
        <button className={cn("w-full flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-secondary rounded", isBold && "bg-secondary")}
          onClick={(e) => {
            e.stopPropagation();
            const newStyle = isBold ? (isItalic ? 'italic' : null) : (isItalic ? 'bold-italic' : 'bold');
            onUpdateField(taskId, 'text_style', newStyle);
          }}>
          <Bold className="w-3 h-3" /> Bold
        </button>
        <button className={cn("w-full flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-secondary rounded", isItalic && "bg-secondary")}
          onClick={(e) => {
            e.stopPropagation();
            const newStyle = isItalic ? (isBold ? 'bold' : null) : (isBold ? 'bold-italic' : 'italic');
            onUpdateField(taskId, 'text_style', newStyle);
          }}>
          <Italic className="w-3 h-3" /> Italic
        </button>
  
        <Separator className="my-1" />
  
        {/* Move & Delete */}
        <button className="w-full flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-secondary rounded"
          onClick={(e) => { e.stopPropagation(); handleAction(() => onMoveUp(taskId)); }}>
          <ArrowUp className="w-3 h-3" /> Di chuyển lên
        </button>
        <button className="w-full flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-secondary rounded"
          onClick={(e) => { e.stopPropagation(); handleAction(() => onMoveDown(taskId)); }}>
          <ArrowDown className="w-3 h-3" /> Di chuyển xuống
        </button>
  
        <Separator className="my-1" />
  
        <button className="w-full flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-secondary rounded text-destructive"
          onClick={(e) => { e.stopPropagation(); handleAction(() => onDeleteTask(taskId)); }}>
          <Trash2 className="w-3 h-3" /> Xóa
        </button>
      </div>
    );
  }