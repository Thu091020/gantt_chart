import { TaskFormDialog } from '../dialogs/CreateTaskDialog';
import { BaselineDialog } from '../dialogs/BaselineManagerDialog';
import ConfirmModal from '../dialogs/ModalConfirm';
import { Task } from '../../types/task.types';

interface GanttModalsProps {
  dialogs: any; // State từ useGanttState
  editingTask: Task | null;
  tasks: Task[];
  projectMembers: any[];
  projectId: string;
  allocations: any[];
  onSaveTask: (data: any) => void;
  onViewBaseline: (data: any) => void;
  onConfirmDelete: () => void;
  onConfirmRestoreBaseline: () => void;
  restorePending: boolean;
  viewingBaselineName?: string;
  selectedCount: number;
}

export const GanttModals = ({
  dialogs, editingTask, tasks, projectMembers, projectId, allocations,
  onSaveTask, onViewBaseline, onConfirmDelete, onConfirmRestoreBaseline,
  restorePending, viewingBaselineName, selectedCount
}: GanttModalsProps) => {
  return (
    <>
      <TaskFormDialog
        open={dialogs.showAddDialog}
        onOpenChange={dialogs.setShowAddDialog}
        task={editingTask}
        tasks={tasks}
        projectMembers={projectMembers}
        onSave={onSaveTask}
      />

      <BaselineDialog
        open={dialogs.showBaselineDialog}
        onOpenChange={dialogs.setShowBaselineDialog}
        projectId={projectId}
        tasks={tasks}
        allocations={allocations}
        onViewBaseline={onViewBaseline}
      />

      <ConfirmModal
        open={dialogs.showDeleteConfirm}
        onOpenChange={dialogs.setShowDeleteConfirm}
        title="Xác nhận xóa"
        description={selectedCount > 1 ? `Xóa ${selectedCount} task?` : 'Xóa task này?'}
        confirmText="Xóa"
        cancelText="Hủy"
        variant="destructive"
        onConfirm={onConfirmDelete}
      />

      <ConfirmModal
        open={dialogs.showRestoreBaselineConfirm}
        onOpenChange={dialogs.setShowRestoreBaselineConfirm}
        title="Khôi phục baseline?"
        description={`Thay thế dữ liệu bằng baseline "${viewingBaselineName}"?`}
        confirmText="Xác nhận"
        isLoading={restorePending}
        onConfirm={onConfirmRestoreBaseline}
      />
    </>
  );
};