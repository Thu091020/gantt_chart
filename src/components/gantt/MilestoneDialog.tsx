import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Flag, Plus, Trash2, Edit2 } from 'lucide-react';
import { 
  useProjectMilestones, 
  useAddProjectMilestone, 
  useUpdateProjectMilestone, 
  useDeleteProjectMilestone,
  ProjectMilestone 
} from '@/hooks/useProjectMilestones';
import { format, parseISO } from 'date-fns';

interface MilestoneDialogProps {
  projectId: string;
}

const DEFAULT_COLORS = [
  '#8B5CF6', // Purple (default)
  '#EC4899', // Pink
  '#EF4444', // Red
  '#F59E0B', // Orange
  '#10B981', // Green
  '#3B82F6', // Blue
];

export function MilestoneDialog({ projectId }: MilestoneDialogProps) {
  const { data: milestones = [] } = useProjectMilestones(projectId);
  const addMilestone = useAddProjectMilestone();
  const updateMilestone = useUpdateProjectMilestone();
  const deleteMilestone = useDeleteProjectMilestone();
  
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [color, setColor] = useState(DEFAULT_COLORS[0]);
  const [description, setDescription] = useState('');

  const resetForm = () => {
    setName('');
    setDate('');
    setColor(DEFAULT_COLORS[0]);
    setDescription('');
    setEditingId(null);
  };

  const handleAdd = async () => {
    if (!name.trim() || !date) return;
    
    await addMilestone.mutateAsync({
      project_id: projectId,
      name: name.trim(),
      date,
      color,
      description: description.trim() || null,
    });
    resetForm();
  };

  const handleUpdate = async () => {
    if (!editingId || !name.trim() || !date) return;
    
    await updateMilestone.mutateAsync({
      id: editingId,
      projectId,
      data: {
        name: name.trim(),
        date,
        color,
        description: description.trim() || null,
      }
    });
    resetForm();
  };

  const handleDelete = async (id: string) => {
    await deleteMilestone.mutateAsync({ id, projectId });
  };

  const startEdit = (milestone: ProjectMilestone) => {
    setEditingId(milestone.id);
    setName(milestone.name);
    setDate(milestone.date);
    setColor(milestone.color);
    setDescription(milestone.description || '');
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs">
          <Flag className="w-3.5 h-3.5" />
          Milestones
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Quản lý Milestones</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Form */}
          <div className="space-y-3 p-3 border rounded-lg bg-secondary/30">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Tên milestone *</Label>
                <Input
                  placeholder="VD: Go-live, UAT..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-8 text-sm mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Ngày *</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-8 text-sm mt-1"
                />
              </div>
            </div>
            
            <div>
              <Label className="text-xs">Mô tả</Label>
              <Textarea
                placeholder="Mô tả ngắn..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-16 text-sm mt-1 resize-none"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {DEFAULT_COLORS.map(c => (
                  <button
                    key={c}
                    className="w-6 h-6 rounded border-2 transition-all"
                    style={{ 
                      backgroundColor: c,
                      borderColor: color === c ? '#000' : 'transparent'
                    }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
              
              <div className="flex gap-2">
                {editingId && (
                  <Button variant="ghost" size="sm" onClick={resetForm}>
                    Hủy
                  </Button>
                )}
                <Button 
                  size="sm" 
                  onClick={editingId ? handleUpdate : handleAdd}
                  disabled={!name.trim() || !date}
                >
                  {editingId ? 'Cập nhật' : <><Plus className="w-4 h-4 mr-1" /> Thêm</>}
                </Button>
              </div>
            </div>
          </div>

          {/* List */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Danh sách milestones</Label>
            {milestones.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-4">
                Chưa có milestone nào
              </div>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin">
                {milestones.map(m => (
                  <div
                    key={m.id}
                    className="flex items-center gap-2 p-2 rounded border bg-card hover:bg-secondary/30"
                  >
                    <div
                      className="w-1 h-8 rounded-full shrink-0"
                      style={{ backgroundColor: m.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{m.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(parseISO(m.date), 'dd/MM/yyyy')}
                        {m.description && ` - ${m.description}`}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => startEdit(m)}
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(m.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
