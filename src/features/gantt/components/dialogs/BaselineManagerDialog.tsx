import { useState } from 'react';
import {
  Button,
  Input,
  Label,
  Textarea,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  ScrollArea,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../internal/ui';
import type { Baseline } from '../../types/gantt.types';
import { useBaselinesAdapter, useAddBaseline, useDeleteBaseline, useRestoreBaseline } from '../../context/hooks';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Trash2, RotateCcw, Plus, History, Loader2, Eye } from 'lucide-react';
import { cn } from '../internal/utils';

interface BaselineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  tasks: any[];
  allocations: any[];
  onViewBaseline?: (baseline: Baseline) => void;
}

export function BaselineDialog({ 
  open, 
  onOpenChange, 
  projectId, 
  tasks, 
  allocations,
  onViewBaseline
}: BaselineDialogProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  
  const { data: baselines = [], isLoading } = useBaselinesAdapter(projectId);
  const addBaseline = useAddBaseline();
  const deleteBaseline = useDeleteBaseline();
  const restoreBaseline = useRestoreBaseline();

  const handleCreate = async () => {
    if (!name.trim()) return;
    
    await addBaseline.mutateAsync({
      projectId,
      name: name.trim(),
      description: description.trim() || undefined,
      tasks,
      allocations: allocations.filter(a => a.project_id === projectId)
    });
    
    setName('');
    setDescription('');
    setShowCreateForm(false);
  };

  const handleRestore = async (baseline: Baseline) => {
    await restoreBaseline.mutateAsync({
      baselineId: baseline.id,
      projectId
    });
    onOpenChange(false);
  };

  const handleDelete = async (baseline: Baseline) => {
    await deleteBaseline.mutateAsync({
      id: baseline.id,
      projectId
    });
  };

  const handleView = (baseline: Baseline) => {
    if (onViewBaseline) {
      onViewBaseline(baseline);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Quản lý Baselines
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Create new baseline form */}
          {showCreateForm ? (
            <div className="space-y-3 p-3 bg-secondary/30 rounded-lg border border-border">
              <div>
                <Label htmlFor="baseline-name" className="text-xs">Tên version *</Label>
                <Input
                  id="baseline-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Version 1.0 - Kick-off"
                  className="h-8 text-sm mt-1"
                />
              </div>
              <div>
                <Label htmlFor="baseline-desc" className="text-xs">Mô tả</Label>
                <Textarea
                  id="baseline-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ghi chú về version này..."
                  className="text-sm mt-1 min-h-[60px]"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={handleCreate}
                  disabled={!name.trim() || addBaseline.isPending}
                >
                  {addBaseline.isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                  Lưu
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => {
                    setShowCreateForm(false);
                    setName('');
                    setDescription('');
                  }}
                >
                  Hủy
                </Button>
              </div>
            </div>
          ) : (
            <Button 
              variant="outline" 
              className="w-full gap-2"
              onClick={() => setShowCreateForm(true)}
            >
              <Plus className="w-4 h-4" />
              Tạo baseline mới từ trạng thái hiện tại
            </Button>
          )}

          {/* Baseline list */}
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">
              Danh sách baselines ({baselines.length})
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : baselines.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Chưa có baseline nào được lưu
              </div>
            ) : (
              <ScrollArea className="h-[280px]">
                <div className="space-y-2 pr-3">
                  {baselines.map((baseline) => (
                    <div 
                      key={baseline.id}
                      className="p-3 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{baseline.name}</div>
                          {baseline.description && (
                            <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {baseline.description}
                            </div>
                          )}
                          <div className="text-[10px] text-muted-foreground mt-1">
                            {format(new Date(baseline.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                            {' • '}
                            {(baseline.snapshot as any)?.tasks?.length || 0} tasks
                            {' • '}
                            {(baseline.snapshot as any)?.allocations?.length || 0} allocations
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {/* View button */}
                          <TooltipProvider delayDuration={300}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                                  onClick={() => handleView(baseline)}
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                Xem baseline (chỉ đọc)
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          {/* Restore button with confirm dialog */}
                          <TooltipProvider delayDuration={300}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-7 w-7 p-0 text-primary hover:text-primary"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Xác nhận khôi phục baseline?</AlertDialogTitle>
                                      <AlertDialogDescription className="space-y-2">
                                        <p>Bạn sắp khôi phục dự án về trạng thái của baseline <strong>"{baseline.name}"</strong>.</p>
                                        <p className="text-destructive">
                                          ⚠️ Tất cả dữ liệu hiện tại (tiến độ và phân bổ nguồn lực) sẽ bị thay thế hoàn toàn.
                                        </p>
                                        <p>Hãy tạo một baseline mới trước nếu bạn muốn giữ lại trạng thái hiện tại.</p>
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Hủy</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => handleRestore(baseline)}
                                        disabled={restoreBaseline.isPending}
                                        className="bg-primary"
                                      >
                                        {restoreBaseline.isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                                        Xác nhận khôi phục
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                Khôi phục baseline này
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          {/* Delete button with confirm dialog */}
                          <TooltipProvider delayDuration={300}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Xác nhận xóa baseline?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Baseline <strong>"{baseline.name}"</strong> sẽ bị xóa vĩnh viễn. 
                                        Bạn không thể hoàn tác hành động này.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Hủy</AlertDialogCancel>
                                      <AlertDialogAction 
                                        onClick={() => handleDelete(baseline)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        disabled={deleteBaseline.isPending}
                                      >
                                        {deleteBaseline.isPending && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                                        Xác nhận xóa
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                Xóa baseline
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
