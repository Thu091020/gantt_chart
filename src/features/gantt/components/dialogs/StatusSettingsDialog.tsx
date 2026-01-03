import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, Button, Input, Label } from '../internal/ui';
import { toast } from '../internal/utils';
import type { TaskStatus } from '../../types/gantt.types';
import { useTaskStatusesAdapter, useAddTaskStatus, useUpdateTaskStatus, useDeleteTaskStatus } from '../../context/hooks';
import { Settings2, Plus, Trash2, GripVertical } from 'lucide-react';

interface StatusSettingsDialogProps {
  projectId: string;
}

const DEFAULT_COLORS = [
  '#6B7280', // Gray
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
];

export function StatusSettingsDialog({ projectId }: StatusSettingsDialogProps) {
  const { data: statuses = [] } = useTaskStatusesAdapter(projectId);
  const addStatus = useAddTaskStatus();
  const updateStatus = useUpdateTaskStatus();
  const deleteStatus = useDeleteTaskStatus();
  
  const [open, setOpen] = useState(false);
  const [newStatusName, setNewStatusName] = useState('');
  const [newStatusColor, setNewStatusColor] = useState(DEFAULT_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  const handleAddStatus = async () => {
    if (!newStatusName.trim()) {
      toast.error('Vui lòng nhập tên trạng thái');
      return;
    }
    
    try {
      await addStatus.mutateAsync({
        project_id: projectId,
        name: newStatusName.trim(),
        color: newStatusColor,
        sort_order: statuses.length,
        is_default: false,
      });
      setNewStatusName('');
      setNewStatusColor(DEFAULT_COLORS[0]);
      toast.success('Đã thêm trạng thái mới');
    } catch (error) {
      toast.error('Lỗi khi thêm trạng thái');
    }
  };

  const handleUpdateStatus = async (id: string) => {
    if (!editName.trim()) {
      toast.error('Vui lòng nhập tên trạng thái');
      return;
    }
    
    try {
      await updateStatus.mutateAsync({
        id,
        data: { name: editName.trim(), color: editColor }
      });
      setEditingId(null);
      toast.success('Đã cập nhật trạng thái');
    } catch (error) {
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  };

  const handleDeleteStatus = async (status: TaskStatus) => {
    if (status.is_default) {
      toast.error('Không thể xóa trạng thái mặc định');
      return;
    }
    
    try {
      await deleteStatus.mutateAsync(status.id);
      toast.success('Đã xóa trạng thái');
    } catch (error) {
      toast.error('Lỗi khi xóa trạng thái');
    }
  };

  const startEdit = (status: TaskStatus) => {
    setEditingId(status.id);
    setEditName(status.name);
    setEditColor(status.color);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <Settings2 className="w-3 h-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Quản lý trạng thái</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Add new status */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Thêm trạng thái mới</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Tên trạng thái"
                value={newStatusName}
                onChange={(e) => setNewStatusName(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleAddStatus()}
              />
              <Input
                type="color"
                value={newStatusColor}
                onChange={(e) => setNewStatusColor(e.target.value)}
                className="w-12 p-1 h-9"
              />
              <Button size="sm" onClick={handleAddStatus}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex gap-1 flex-wrap">
              {DEFAULT_COLORS.map(color => (
                <button
                  key={color}
                  className="w-6 h-6 rounded border-2 transition-all"
                  style={{ 
                    backgroundColor: color,
                    borderColor: newStatusColor === color ? '#000' : 'transparent'
                  }}
                  onClick={() => setNewStatusColor(color)}
                />
              ))}
            </div>
          </div>

          {/* Status list */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Danh sách trạng thái</Label>
            <div className="space-y-1 max-h-64 overflow-y-auto scrollbar-thin">
              {statuses.map(status => (
                <div
                  key={status.id}
                  className="flex items-center gap-2 p-2 rounded border bg-card hover:bg-secondary/30"
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                  
                  {editingId === status.id ? (
                    <>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 h-7 text-sm"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdateStatus(status.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        autoFocus
                      />
                      <Input
                        type="color"
                        value={editColor}
                        onChange={(e) => setEditColor(e.target.value)}
                        className="w-8 p-0.5 h-7"
                      />
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => handleUpdateStatus(status.id)}>
                        Lưu
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditingId(null)}>
                        Hủy
                      </Button>
                    </>
                  ) : (
                    <>
                      <div
                        className="w-4 h-4 rounded-full shrink-0"
                        style={{ backgroundColor: status.color }}
                      />
                      <span 
                        className="flex-1 text-sm cursor-pointer"
                        onClick={() => startEdit(status)}
                      >
                        {status.name}
                      </span>
                      {status.is_default && (
                        <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                          Mặc định
                        </span>
                      )}
                      {!status.is_default && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteStatus(status)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
