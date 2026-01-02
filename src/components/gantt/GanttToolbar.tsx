import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { DateRangePickerPopup } from '@/components/common/DateRangePickerPopup';
import { MilestoneDialog } from './MilestoneDialog';
import { TaskBarLabels } from '@/hooks/useViewSettings';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  ChevronRight, 
  ChevronLeft,
  ArrowUp, 
  ArrowDown, 
  RefreshCw, 
  Upload, 
  Download,
  Indent,
  Outdent,
  Wand2,
  CalendarIcon,
  History,
  ArrowUpToLine,
  ArrowDownToLine,
  Settings2,
  Copy,
  Bold,
  Italic,
  Users,
  Check,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addMonths, differenceInDays } from 'date-fns';
import { vi } from 'date-fns/locale';

export type GanttViewMode = 'day' | 'week' | 'month';

export type { TaskBarLabels } from '@/hooks/useViewSettings';

interface FilterEmployee {
  id: string;
  name: string;
  code: string;
}

interface GanttToolbarProps {
  selectedTaskId: string | null;
  selectedCount: number;
  canMultiIndent: boolean;
  canCopy: boolean;
  viewMode: GanttViewMode;
  customViewMode: boolean;
  startDate: Date;
  endDate: Date;
  taskBarLabels: TaskBarLabels;
  selectedTasksTextStyle: string | null | 'mixed';
  collaborationSlot?: React.ReactNode;
  filterEmployees: FilterEmployee[];
  filterAssigneeIds: string[];
  projectId: string;
  onFilterAssigneesChange: (ids: string[]) => void;
  onAddTask: () => void;
  onInsertAbove: () => void;
  onInsertBelow: () => void;
  onEditTask: () => void;
  onDeleteTask: () => void;
  onCopyTask: () => void;
  onIndent: () => void;
  onOutdent: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleBold: () => void;
  onToggleItalic: () => void;
  onSyncAllocations: (startDate?: Date, endDate?: Date) => void;
  onImportCSV: () => void;
  onExportCSV: () => void;
  onGenerateFakeData?: () => void;
  onOpenBaselines: () => void;
  onViewModeChange: (mode: GanttViewMode) => void;
  onCustomRangeChange: (start: Date, end: Date) => void;
  onGoToPrevious: () => void;
  onGoToNext: () => void;
  onGoToToday: () => void;
  onTaskBarLabelsChange: (labels: TaskBarLabels) => void;
}

interface ToolbarButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'destructive';
  active?: boolean;
}

function ToolbarButton({ icon, label, onClick, disabled, variant, active }: ToolbarButtonProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 w-7 p-0",
              variant === 'destructive' && "text-destructive hover:text-destructive hover:bg-destructive/10",
              active && "bg-secondary"
            )}
            onClick={onClick}
            disabled={disabled}
          >
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function GanttToolbar({
  selectedTaskId,
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
  onFilterAssigneesChange,
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
  onSyncAllocations,
  onImportCSV,
  onExportCSV,
  onGenerateFakeData,
  onOpenBaselines,
  onViewModeChange,
  onCustomRangeChange,
  onGoToPrevious,
  onGoToNext,
  onGoToToday,
  onTaskBarLabelsChange
}: GanttToolbarProps) {
  const hasSelection = selectedCount > 0;
  const hasSingleSelection = selectedCount === 1;
  const canIndentOutdent = hasSingleSelection || (hasSelection && canMultiIndent);
  const [syncPopoverOpen, setSyncPopoverOpen] = useState(false);
  const [syncStartDate, setSyncStartDate] = useState<Date>(new Date());
  const [syncEndDate, setSyncEndDate] = useState<Date>(addMonths(new Date(), 3));
  const [startDatePickerOpen, setStartDatePickerOpen] = useState(false);
  const [endDatePickerOpen, setEndDatePickerOpen] = useState(false);
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  
  // Calculate bold/italic active state
  const isBoldActive = selectedTasksTextStyle === 'bold' || selectedTasksTextStyle === 'bold-italic';
  const isItalicActive = selectedTasksTextStyle === 'italic' || selectedTasksTextStyle === 'bold-italic';

  // Filter employees by search
  const filteredEmployees = filterEmployees.filter(emp =>
    emp.name.toLowerCase().includes(filterSearch.toLowerCase()) ||
    emp.code.toLowerCase().includes(filterSearch.toLowerCase())
  );

  const toggleFilterEmployee = (id: string) => {
    if (filterAssigneeIds.includes(id)) {
      onFilterAssigneesChange(filterAssigneeIds.filter(i => i !== id));
    } else {
      onFilterAssigneesChange([...filterAssigneeIds, id]);
    }
  };

  // Reset dates when popover opens
  const handleSyncPopoverChange = (open: boolean) => {
    if (open) {
      setSyncStartDate(new Date());
      setSyncEndDate(addMonths(new Date(), 3));
    }
    setSyncPopoverOpen(open);
  };

  // Calculate duration in months
  const getDurationLabel = () => {
    const days = differenceInDays(syncEndDate, syncStartDate);
    const months = days / 30;
    if (months < 1) {
      return `${days} ngày`;
    }
    return `${Math.round(months * 10) / 10} tháng`;
  };

  const handleSync = () => {
    onSyncAllocations(syncStartDate, syncEndDate);
    setSyncPopoverOpen(false);
  };

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border bg-card">
      {/* Add task */}
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

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* Edit & Delete */}
      <ToolbarButton
        icon={<Edit2 className="w-3.5 h-3.5" />}
        label="Sửa task (F2)"
        onClick={onEditTask}
        disabled={!hasSingleSelection}
      />
      <ToolbarButton
        icon={<Trash2 className="w-3.5 h-3.5" />}
        label={hasSelection && selectedCount > 1 ? `Xóa ${selectedCount} tasks` : "Xóa task (Delete)"}
        onClick={onDeleteTask}
        disabled={!hasSelection}
        variant="destructive"
      />
      <ToolbarButton
        icon={<Copy className="w-3.5 h-3.5" />}
        label={selectedCount > 1 ? `Copy ${selectedCount} tasks (Ctrl+D)` : "Copy task (Ctrl+D)"}
        onClick={onCopyTask}
        disabled={!canCopy}
      />

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* Text Style - Bold & Italic */}
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

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* Indent & Outdent */}
      <ToolbarButton
        icon={<Indent className="w-3.5 h-3.5" />}
        label={selectedCount > 1 ? `Indent ${selectedCount} tasks (Tab)` : "Indent - Thành task con (Tab)"}
        onClick={onIndent}
        disabled={!canIndentOutdent}
      />
      <ToolbarButton
        icon={<Outdent className="w-3.5 h-3.5" />}
        label={selectedCount > 1 ? `Outdent ${selectedCount} tasks (Shift+Tab)` : "Outdent - Thành task cha (Shift+Tab)"}
        onClick={onOutdent}
        disabled={!canIndentOutdent}
      />

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* Move Up & Down */}
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

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* Import/Export */}
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

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* Generate fake data */}
      {onGenerateFakeData && (
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
              Tạo 50+ task mẫu với quan hệ BA-Design-Dev-Test
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      <Separator orientation="vertical" className="h-5 mx-1" />

      {/* Sync with date picker */}
      <Popover open={syncPopoverOpen} onOpenChange={handleSyncPopoverChange}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 px-2 gap-1 text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            Đồng bộ
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-3" align="start">
          <div className="space-y-3">
            <div className="text-sm font-medium">Đồng bộ nguồn lực</div>
            <div className="text-xs text-muted-foreground">
              Chọn khoảng thời gian để đồng bộ allocation từ tasks sang nguồn lực
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Từ ngày</div>
                <Popover open={startDatePickerOpen} onOpenChange={setStartDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8">
                      <CalendarIcon className="w-3 h-3 mr-1" />
                      {format(syncStartDate, 'dd/MM/yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={syncStartDate}
                      defaultMonth={syncStartDate}
                      onSelect={(date) => {
                        if (date) {
                          setSyncStartDate(date);
                          setStartDatePickerOpen(false);
                        }
                      }}
                      initialFocus
                      locale={vi}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Đến ngày</div>
                <Popover open={endDatePickerOpen} onOpenChange={setEndDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8">
                      <CalendarIcon className="w-3 h-3 mr-1" />
                      {format(syncEndDate, 'dd/MM/yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={syncEndDate}
                      defaultMonth={syncEndDate}
                      onSelect={(date) => {
                        if (date) {
                          setSyncEndDate(date);
                          setEndDatePickerOpen(false);
                        }
                      }}
                      initialFocus
                      locale={vi}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground text-center py-1 bg-secondary/30 rounded">
              Tổng thời gian: <span className="font-medium text-foreground">{getDurationLabel()}</span>
            </div>
            
            <Button size="sm" className="w-full" onClick={handleSync}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Đồng bộ nguồn lực
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Baseline button */}
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
            Lưu và khôi phục các phiên bản dự án
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Milestones */}
      <MilestoneDialog projectId={projectId} />

      {/* Task bar label settings */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 px-2 gap-1 text-xs">
            <Settings2 className="w-3.5 h-3.5" />
            Hiển thị
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-3" align="start">
          <div className="space-y-3">
            <div className="text-sm font-medium">Hiển thị trên task bar</div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="showName" 
                  checked={taskBarLabels.showName}
                  onCheckedChange={(checked) => 
                    onTaskBarLabelsChange({ ...taskBarLabels, showName: !!checked })
                  }
                />
                <Label htmlFor="showName" className="text-xs cursor-pointer">Tên task</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="showAssignees" 
                  checked={taskBarLabels.showAssignees}
                  onCheckedChange={(checked) => 
                    onTaskBarLabelsChange({ ...taskBarLabels, showAssignees: !!checked })
                  }
                />
                <Label htmlFor="showAssignees" className="text-xs cursor-pointer">Người thực hiện</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="showDuration" 
                  checked={taskBarLabels.showDuration}
                  onCheckedChange={(checked) => 
                    onTaskBarLabelsChange({ ...taskBarLabels, showDuration: !!checked })
                  }
                />
                <Label htmlFor="showDuration" className="text-xs cursor-pointer">Duration</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="showDates" 
                  checked={taskBarLabels.showDates}
                  onCheckedChange={(checked) => 
                    onTaskBarLabelsChange({ ...taskBarLabels, showDates: !!checked })
                  }
                />
                <Label htmlFor="showDates" className="text-xs cursor-pointer">Ngày bắt đầu - kết thúc</Label>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Filter by assignees */}
      <Popover open={filterPopoverOpen} onOpenChange={setFilterPopoverOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant={filterAssigneeIds.length > 0 ? "secondary" : "ghost"} 
            size="sm" 
            className={cn(
              "h-7 px-2 gap-1 text-xs",
              filterAssigneeIds.length > 0 && "bg-primary/10 text-primary border border-primary/30"
            )}
          >
            <Users className="w-3.5 h-3.5" />
            {filterAssigneeIds.length === 0 ? (
              'Lọc người'
            ) : (
              <>{filterAssigneeIds.length} người</>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-2" align="start">
          <div className="space-y-2">
            <div className="text-sm font-medium">Lọc theo người thực hiện</div>
            <Input
              placeholder="Tìm nhân sự..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="h-7 text-xs"
            />
            {filterAssigneeIds.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start text-xs text-muted-foreground h-7"
                onClick={() => {
                  onFilterAssigneesChange([]);
                  setFilterPopoverOpen(false);
                }}
              >
                <X className="w-3 h-3 mr-1" />
                Bỏ lọc ({filterAssigneeIds.length} đang chọn)
              </Button>
            )}
            <div className="space-y-0.5 max-h-[250px] overflow-y-auto scrollbar-thin">
              {filteredEmployees.map(emp => (
                <button
                  key={emp.id}
                  onClick={() => toggleFilterEmployee(emp.id)}
                  className={cn(
                    'w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-secondary/50',
                    filterAssigneeIds.includes(emp.id) && 'bg-primary/10'
                  )}
                >
                  <div className="flex-1 text-left">
                    <div className="truncate font-medium">{emp.name}</div>
                    <div className="text-muted-foreground text-[10px]">{emp.code}</div>
                  </div>
                  {filterAssigneeIds.includes(emp.id) && <Check className="w-3 h-3 shrink-0 text-primary" />}
                </button>
              ))}
              {filteredEmployees.length === 0 && (
                <div className="text-xs text-muted-foreground text-center py-2">
                  Không tìm thấy nhân sự
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Collaboration Avatars - injected via slot */}
      {collaborationSlot}

      {/* View controls - aligned right */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onGoToPrevious}>
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={onGoToToday}>
            Hôm nay
          </Button>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onGoToNext}>
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-5" />

        <div className="flex gap-0.5 bg-secondary/50 p-0.5 rounded">
          {(['day', 'week', 'month'] as GanttViewMode[]).map(m => (
            <button
              key={m}
              onClick={() => onViewModeChange(m)}
              className={cn(
                'px-2 py-0.5 text-[10px] rounded transition-colors',
                viewMode === m && !customViewMode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {m === 'day' ? 'Ngày' : m === 'week' ? 'Tuần' : 'Tháng'}
            </button>
          ))}
        </div>

        <DateRangePickerPopup
          startDate={startDate}
          endDate={endDate}
          onRangeChange={onCustomRangeChange}
        />
      </div>
    </div>
  );
}
