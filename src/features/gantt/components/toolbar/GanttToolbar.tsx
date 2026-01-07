import React from 'react';
import {
  Button,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../internal/ui'; // UI components
import { MilestoneDialog } from '../dialogs/MilestoneDialog';
import ToolbarButton from './ToolbarButton'; // Component nút bấm toolbar đơn lẻ
import {
  Plus,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  Upload,
  Download,
  Indent,
  Outdent,
  Wand2,
  History,
  ArrowUpToLine,
  ArrowDownToLine,
  Copy,
  Bold,
  Italic,
} from 'lucide-react'; // Icons

// --- IMPORT CÁC COMPONENT ĐÃ TÁCH ---
// (Hãy đảm bảo đường dẫn import đúng với nơi bạn lưu file)
import { ToolbarFilter } from './ToolbarFilter';
import { ToolbarSync } from './ToolbarSync';
import { ToolbarViewSettings } from './ToolbarViewSettings';
import { ToolbarViewControls } from './ToolbarViewControls';

// --- TYPES ---
export type GanttViewMode = 'day' | 'week' | 'month';

export type { TaskBarLabels } from '../../types/gantt.types';
import type { TaskBarLabels } from '../../types/gantt.types';

interface FilterEmployee {
  id: string;
  name: string;
  code: string;
}

export interface GanttToolbarProps {
  // Selection & State
  selectedTaskId: string | null;
  selectedCount: number;
  canMultiIndent: boolean;
  canCopy: boolean;
  
  // View Configuration
  viewMode: GanttViewMode;
  customViewMode: boolean;
  startDate: Date;
  endDate: Date;
  taskBarLabels: TaskBarLabels;
  selectedTasksTextStyle: string | null | 'mixed';
  
  // Data & Filters
  collaborationSlot?: React.ReactNode;
  filterEmployees: FilterEmployee[];
  filterAssigneeIds: string[];
  projectId: string;
  
  // Handlers - Actions
  onAddTask: () => void;
  onInsertAbove: () => void;
  onInsertBelow: () => void;
  onEditTask: () => void;
  onDeleteTask: () => void;
  onCopyTask: () => void;
  
  // Handlers - Structure & Move
  onIndent: () => void;
  onOutdent: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  
  // Handlers - Formatting
  onToggleBold: () => void;
  onToggleItalic: () => void;
  
  // Handlers - Data IO
  onImportCSV: () => void;
  onExportCSV: () => void;
  onGenerateFakeData?: () => void;
  
  // Handlers - Advanced
  onSyncAllocations: (startDate?: Date, endDate?: Date) => void;
  onOpenBaselines: () => void;
  onFilterAssigneesChange: (ids: string[]) => void;
  onTaskBarLabelsChange: (labels: TaskBarLabels) => void;
  
  // Handlers - View Navigation
  onViewModeChange: (mode: GanttViewMode) => void;
  onCustomRangeChange: (start: Date, end: Date) => void;
  onGoToPrevious: () => void;
  onGoToNext: () => void;
  onGoToToday: () => void;
}

export function GanttToolbar(props: GanttToolbarProps) {
  // Destructuring props để code phía dưới gọn gàng hơn
  const {
    selectedCount,
    canMultiIndent,
    canCopy,
    viewMode,
    customViewMode,
    startDate,
    endDate,
    taskBarLabels,
    selectedTasksTextStyle,
    collaborationSlot,
    filterEmployees,
    filterAssigneeIds,
    projectId,
    // Actions
    onAddTask,
    onInsertAbove,
    onInsertBelow,
    onEditTask,
    onDeleteTask,
    onCopyTask,
    onIndent,
    onOutdent,
    onMoveUp,
    onMoveDown,
    onToggleBold,
    onToggleItalic,
    onImportCSV,
    onExportCSV,
    onGenerateFakeData,
    onSyncAllocations,
    onOpenBaselines,
    onFilterAssigneesChange,
    onTaskBarLabelsChange,
    onViewModeChange,
    onCustomRangeChange,
    onGoToPrevious,
    onGoToNext,
    onGoToToday,
  } = props;

  // Logic tính toán trạng thái
  const hasSelection = selectedCount > 0;
  const hasSingleSelection = selectedCount === 1;
  const canIndentOutdent = hasSingleSelection || (hasSelection && canMultiIndent);
  
  const isBoldActive =
    selectedTasksTextStyle === 'bold' || selectedTasksTextStyle === 'bold-italic';
  const isItalicActive =
    selectedTasksTextStyle === 'italic' || selectedTasksTextStyle === 'bold-italic';

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border bg-card overflow-x-auto no-scrollbar">
      {/* --- NHÓM 1: THÊM MỚI --- */}
      <div className="flex items-center gap-0.5">
        <ToolbarButton
          icon={<Plus className="w-4 h-4" />}
          label="Thêm task (Ctrl+N)"
          onClick={onAddTask}
        />
        <ToolbarButton
          icon={<ArrowUpToLine className="w-3.5 h-3.5" />}
          label="Chèn dòng trên"
          onClick={onInsertAbove}
          disabled={!hasSingleSelection}
        />
        <ToolbarButton
          icon={<ArrowDownToLine className="w-3.5 h-3.5" />}
          label="Chèn dòng dưới"
          onClick={onInsertBelow}
          disabled={!hasSingleSelection}
        />
      </div>

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* --- NHÓM 2: SỬA / XÓA / COPY --- */}
      <div className="flex items-center gap-0.5">
        <ToolbarButton
          icon={<Edit2 className="w-3.5 h-3.5" />}
          label="Sửa task (F2)"
          onClick={onEditTask}
          disabled={!hasSingleSelection}
        />
        <ToolbarButton
          icon={<Trash2 className="w-3.5 h-3.5" />}
          label={hasSelection && selectedCount > 1 ? `Xóa ${selectedCount} tasks` : 'Xóa task'}
          onClick={onDeleteTask}
          disabled={!hasSelection}
          variant="destructive"
        />
        <ToolbarButton
          icon={<Copy className="w-3.5 h-3.5" />}
          label="Copy task (Ctrl+D)"
          onClick={onCopyTask}
          disabled={!canCopy}
        />
      </div>

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* --- NHÓM 3: FORMAT TEXT --- */}
      <div className="flex items-center gap-0.5">
        <ToolbarButton
          icon={<Bold className="w-3.5 h-3.5" />}
          label="Bold (Ctrl+B)"
          onClick={onToggleBold}
          disabled={!hasSelection}
          active={isBoldActive}
        />
        <ToolbarButton
          icon={<Italic className="w-3.5 h-3.5" />}
          label="Italic (Ctrl+I)"
          onClick={onToggleItalic}
          disabled={!hasSelection}
          active={isItalicActive}
        />
      </div>

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* --- NHÓM 4: CẤU TRÚC & DI CHUYỂN --- */}
      <div className="flex items-center gap-0.5">
        <ToolbarButton
          icon={<Indent className="w-3.5 h-3.5" />}
          label="Indent (Tab)"
          onClick={onIndent}
          disabled={!canIndentOutdent}
        />
        <ToolbarButton
          icon={<Outdent className="w-3.5 h-3.5" />}
          label="Outdent (Shift+Tab)"
          onClick={onOutdent}
          disabled={!canIndentOutdent}
        />
        <ToolbarButton
          icon={<ArrowUp className="w-3.5 h-3.5" />}
          label="Di chuyển lên (Ctrl+↑)"
          onClick={onMoveUp}
          disabled={!hasSingleSelection}
        />
        <ToolbarButton
          icon={<ArrowDown className="w-3.5 h-3.5" />}
          label="Di chuyển xuống (Ctrl+↓)"
          onClick={onMoveDown}
          disabled={!hasSingleSelection}
        />
      </div>

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* --- NHÓM 5: IMPORT / EXPORT --- */}
      <div className="flex items-center gap-0.5">
        <ToolbarButton
          icon={<Upload className="w-3.5 h-3.5" />}
          label="Import từ CSV"
          onClick={onImportCSV}
        />
        <ToolbarButton
          icon={<Download className="w-3.5 h-3.5" />}
          label="Export ra CSV"
          onClick={onExportCSV}
        />
        {/* {onGenerateFakeData && (
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 gap-1 text-xs"
                  onClick={onGenerateFakeData}
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  Tạo mẫu
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Tạo dữ liệu mẫu
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )} */}
      </div>

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* --- NHÓM 6: CÔNG CỤ NÂNG CAO (Sync, Baseline, Settings, Filter) --- */}
      <div className="flex items-center gap-0.5">
        {/* Component Đồng bộ */}
        <ToolbarSync onSync={(s, e) => onSyncAllocations(s, e)} />

        {/* Nút Baseline */}
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 gap-1 text-xs"
                onClick={onOpenBaselines}
              >
                <History className="w-3.5 h-3.5" />
                Baseline
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Quản lý phiên bản dự án
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Milestone Dialog */}
        <MilestoneDialog projectId={projectId} />

        {/* Component Cài đặt hiển thị TaskBar */}
        <ToolbarViewSettings
          labels={taskBarLabels}
          onChange={onTaskBarLabelsChange}
        />

        {/* Component Lọc nhân viên */}
        {/* <ToolbarFilter
          employees={filterEmployees}
          assigneeIds={filterAssigneeIds}
          onChange={onFilterAssigneesChange}
        /> */}
      </div>

      {/* --- SPACER --- */}
      <div className="flex-1" />

      {/* --- COLLABORATION --- */}
      {collaborationSlot}

      {/* --- NHÓM 7: VIEW CONTROLS (Ngày/Tuần/Tháng & Calendar) --- */}
      <div className="ml-2">
        <ToolbarViewControls
          viewMode={viewMode}
          customViewMode={customViewMode}
          startDate={startDate}
          endDate={endDate}
          onViewModeChange={onViewModeChange}
          onRangeChange={onCustomRangeChange}
          onPrevious={onGoToPrevious}
          onNext={onGoToNext}
          onToday={onGoToToday}
        />
      </div>
    </div>
  );
}