import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings2, Plus, Trash2, GripVertical } from 'lucide-react';
import { useTaskLabels, useAddTaskLabel, useUpdateTaskLabel, useDeleteTaskLabel, TaskLabel } from '@/hooks/useTaskLabels';
import { toast } from 'sonner';

interface LabelSettingsDialogProps {
  projectId: string;
}

const DEFAULT_COLORS = [
  '#3B82F6', // Blue (default taskbar color)
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#6B7280', // Gray
];

export function LabelSettingsDialog({ projectId }: LabelSettingsDialogProps) {
  const { data: labels = [] } = useTaskLabels(projectId);
  const addLabel = useAddTaskLabel();
  const updateLabel = useUpdateTaskLabel();
  const deleteLabel = useDeleteTaskLabel();
  
  const [open, setOpen] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(DEFAULT_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  const handleAddLabel = async () => {
    if (!newLabelName.trim()) {
      toast.error('Vui lòng nhập tên label');
      return;
    }
    
    try {
      await addLabel.mutateAsync({
        project_id: projectId,
        name: newLabelName.trim(),
        color: newLabelColor,
        sort_order: labels.length,
        is_default: false,
      });
      setNewLabelName('');
      setNewLabelColor(DEFAULT_COLORS[0]);
      toast.success('Đã thêm label mới');
    } catch (error) {
      toast.error('Lỗi khi thêm label');
    }
  };

  const handleUpdateLabel = async (id: string) => {
    if (!editName.trim()) {
      toast.error('Vui lòng nhập tên label');
      return;
    }
    
    try {
      await updateLabel.mutateAsync({
        id,
        data: { name: editName.trim(), color: editColor }
      });
      setEditingId(null);
      toast.success('Đã cập nhật label');
    } catch (error) {
      toast.error('Lỗi khi cập nhật label');
    }
  };

  const handleDeleteLabel = async (label: TaskLabel) => {
    if (label.is_default) {
      toast.error('Không thể xóa label mặc định');
      return;
    }
    
    try {
      await deleteLabel.mutateAsync(label.id);
      toast.success('Đã xóa label');
    } catch (error) {
      toast.error('Lỗi khi xóa label');
    }
  };

  const startEdit = (label: TaskLabel) => {
    setEditingId(label.id);
    setEditName(label.name);
    setEditColor(label.color);
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
          <DialogTitle>Quản lý Label</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Add new label */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Thêm label mới</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Tên label (VD: BA, Dev, Test...)"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleAddLabel()}
              />
              <Input
                type="color"
                value={newLabelColor}
                onChange={(e) => setNewLabelColor(e.target.value)}
                className="w-12 p-1 h-9"
              />
              <Button size="sm" onClick={handleAddLabel}>
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
                    borderColor: newLabelColor === color ? '#000' : 'transparent'
                  }}
                  onClick={() => setNewLabelColor(color)}
                />
              ))}
            </div>
          </div>

          {/* Label list */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Danh sách label</Label>
            <div className="space-y-1 max-h-64 overflow-y-auto scrollbar-thin">
              {labels.map(label => (
                <div
                  key={label.id}
                  className="flex items-center gap-2 p-2 rounded border bg-card hover:bg-secondary/30"
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                  
                  {editingId === label.id ? (
                    <>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 h-7 text-sm"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdateLabel(label.id);
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
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => handleUpdateLabel(label.id)}>
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
                        style={{ backgroundColor: label.color }}
                      />
                      <span 
                        className="flex-1 text-sm cursor-pointer"
                        onClick={() => startEdit(label)}
                      >
                        {label.name}
                      </span>
                      {label.is_default && (
                        <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                          Mặc định
                        </span>
                      )}
                      {!label.is_default && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteLabel(label)}
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
