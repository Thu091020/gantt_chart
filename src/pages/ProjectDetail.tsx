import { useState, useMemo, useRef, useEffect } from 'react';
import { useTableScroll } from '@/hooks/useTableScroll';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useProject, useProjects } from '@/hooks/useProjects';
import { useEmployees } from '@/hooks/useEmployees';
import { AllocationConflictTooltip } from '@/components/effort/AllocationConflictTooltip';
import { useProjectMembers, useAddProjectMembers, useToggleProjectMemberStatus, useRemoveProjectMember } from '@/hooks/useProjectMembers';
import { useAllocations, useSetAllocation, useBulkSetAllocations } from '@/hooks/useAllocations';
import { useHolidays } from '@/hooks/useHolidays';
import { useSettings, isSaturdayWorkingDay } from '@/hooks/useSettings';
import { useViewSettings, useSaveViewSettings } from '@/hooks/useViewSettings';
import { useUsers } from '@/hooks/useUsers';
import { MainLayout } from '@/components/layout/MainLayout';
import { DateRangePickerPopup } from '@/components/common/DateRangePickerPopup';
import { GanttView } from '@/components/gantt/GanttView';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { format, addDays, addMonths, addWeeks, subWeeks, startOfWeek, startOfMonth, startOfQuarter, endOfMonth, endOfQuarter, eachDayOfInterval, eachWeekOfInterval, isSameDay, isSaturday, isSunday, parse } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, ArrowLeft, UserPlus, X, AlertTriangle, Loader2, Users, TrendingUp, Clock, Calendar, LayoutGrid, GanttChartSquare, Search, Check, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type ViewMode = 'day' | 'week' | 'month' | 'quarter' | 'custom';
type TabMode = 'effort' | 'gantt';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const { data: project, isLoading: projectLoading } = useProject(id || '');
  const { data: allProjects = [] } = useProjects();
  const { data: employees = [] } = useEmployees();
  const { data: projectMembersData = [] } = useProjectMembers(id || '');
  const { data: allocations = [] } = useAllocations(id);
  const { data: holidays = [] } = useHolidays();
  const { data: settings } = useSettings();
  const { data: viewSettings } = useViewSettings();
  const { data: users = [] } = useUsers();
  const saveViewSettings = useSaveViewSettings();
  const addProjectMembers = useAddProjectMembers();
  const toggleMemberStatus = useToggleProjectMemberStatus();
  const removeProjectMember = useRemoveProjectMember();
  const setAllocation = useSetAllocation();
  const bulkSetAllocations = useBulkSetAllocations();
  
  const [startDate, setStartDate] = useState(() => subWeeks(new Date(), 1));
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const initialTab = searchParams.get('view') === 'resources' ? 'effort' : 'gantt';
  const [tabMode, setTabMode] = useState<TabMode>(initialTab);
  const [showMemberDialog, setShowMemberDialog] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [customStartDate, setCustomStartDate] = useState<Date>(() => subWeeks(new Date(), 1));
  const [customEndDate, setCustomEndDate] = useState<Date>(() => addMonths(new Date(), 3));
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  
  // Delete confirmation dialog
  const [deleteConfirmMember, setDeleteConfirmMember] = useState<{ id: string; employeeId: string; name: string } | null>(null);
  
  // Single-click edit state
  const [editingCell, setEditingCell] = useState<{ empId: string; colIdx: number } | null>(null);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const tableScrollRef = useTableScroll<HTMLDivElement>({ maxHeight: 'calc(100vh - 320px)' });
  
  // Fill range dialog
  const [fillRangeDialog, setFillRangeDialog] = useState<{
    empId: string;
    empName: string;
  } | null>(null);
  const [fillStartDate, setFillStartDate] = useState('');
  const [fillEndDate, setFillEndDate] = useState('');
  const [fillEffort, setFillEffort] = useState('');

  // Fullscreen mode
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Handle Escape key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Load saved settings on mount
  useEffect(() => {
    if (viewSettings?.projectDetail && !settingsLoaded) {
      const saved = viewSettings.projectDetail;
      if (saved.startDate) setStartDate(new Date(saved.startDate));
      if (saved.viewMode) setViewMode(saved.viewMode as ViewMode);
      if (saved.customStartDate) setCustomStartDate(new Date(saved.customStartDate));
      if (saved.customEndDate) setCustomEndDate(new Date(saved.customEndDate));
      setSettingsLoaded(true);
    }
  }, [viewSettings, settingsLoaded]);

  // Save settings when view changes
  useEffect(() => {
    if (!settingsLoaded) return;
    
    const timer = setTimeout(() => {
      saveViewSettings.mutate({
        ...viewSettings,
        projectDetail: {
          startDate: startDate.toISOString(),
          viewMode,
          customStartDate: customStartDate.toISOString(),
          customEndDate: customEndDate.toISOString()
        }
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [startDate, viewMode, customStartDate, customEndDate, settingsLoaded]);

  // Build project members with employee data and active status
  const projectMembers = useMemo(() => {
    return projectMembersData.map(pm => {
      const employee = employees.find(e => e.id === pm.employee_id);
      return {
        ...pm,
        name: employee?.name || 'Unknown',
        code: employee?.code || '',
        position: employee?.position || '',
        department: employee?.department || ''
      };
    });
  }, [projectMembersData, employees]);

  // Only active members for certain operations
  const activeProjectMembers = useMemo(() => {
    return projectMembers.filter(m => m.is_active);
  }, [projectMembers]);

  const availableEmployees = useMemo(() => {
    const memberEmployeeIds = projectMembersData.map(pm => pm.employee_id);
    return employees.filter(e => !memberEmployeeIds.includes(e.id) && e.is_active);
  }, [employees, projectMembersData]);

  // Generate columns based on view mode
  const { columns, columnWidth } = useMemo(() => {
    switch (viewMode) {
      case 'day': {
        const endDate = addMonths(startDate, 3);
        const days = eachDayOfInterval({ start: startDate, end: endDate });
        return { 
          columns: days.map(d => ({ date: d, label: format(d, 'dd/MM'), subLabel: format(d, 'EEE', { locale: vi }), isAggregate: false })),
          columnWidth: 'min-w-[42px]'
        };
      }
      case 'week': {
        const start = startOfWeek(startDate, { weekStartsOn: 1 });
        const end = addMonths(start, 3);
        const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
        return { 
          columns: weeks.map(w => ({ date: w, label: `T${format(w, 'w')}`, subLabel: format(w, 'dd/MM'), isAggregate: true })),
          columnWidth: 'min-w-[50px]'
        };
      }
      case 'month': {
        const start = startOfMonth(startDate);
        const months = Array.from({ length: 12 }, (_, i) => addMonths(start, i));
        return { 
          columns: months.map(m => ({ date: m, label: format(m, 'MMM', { locale: vi }), subLabel: format(m, 'yyyy'), isAggregate: true })),
          columnWidth: 'min-w-[60px]'
        };
      }
      case 'quarter': {
        const start = startOfQuarter(startDate);
        const quarters = Array.from({ length: 8 }, (_, i) => addMonths(start, i * 3));
        return { 
          columns: quarters.map(q => ({ date: q, label: `Q${Math.ceil((q.getMonth() + 1) / 3)}`, subLabel: format(q, 'yyyy'), isAggregate: true })),
          columnWidth: 'min-w-[60px]'
        };
      }
      case 'custom': {
        const days = eachDayOfInterval({ start: customStartDate, end: customEndDate });
        return { 
          columns: days.map(d => ({ date: d, label: format(d, 'dd'), subLabel: format(d, 'EEE', { locale: vi }), isAggregate: false })),
          columnWidth: 'min-w-[32px]'
        };
      }
      default: {
        const endDate = addMonths(startDate, 3);
        const days = eachDayOfInterval({ start: startDate, end: endDate });
        return { 
          columns: days.map(d => ({ date: d, label: format(d, 'dd'), subLabel: format(d, 'EEE', { locale: vi }), isAggregate: false })),
          columnWidth: 'min-w-[32px]'
        };
      }
    }
  }, [viewMode, startDate, customStartDate, customEndDate]);

  const isHoliday = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const monthDay = format(date, 'MM-dd');
    return holidays.some(h => {
      if (h.is_recurring) {
        const startMonthDay = h.date.slice(5);
        const endMonthDay = h.end_date ? h.end_date.slice(5) : startMonthDay;
        return monthDay >= startMonthDay && monthDay <= endMonthDay;
      }
      const endDate = h.end_date || h.date;
      return dateStr >= h.date && dateStr <= endDate;
    });
  };

  const isNonWorkingDay = (date: Date) => {
    if (isHoliday(date)) return true;
    if (isSunday(date)) return true;
    if (isSaturday(date)) return !(settings && isSaturdayWorkingDay(date, settings));
    return false;
  };

  // Project stats for cards
  const projectStats = useMemo(() => {
    if (!project) return { totalEffort: 0, avgEffort: 0, workingDays: 0, warningDays: 0 };
    
    const visibleDays = columns.filter(c => !c.isAggregate).map(c => c.date);
    const workingDays = visibleDays.filter(d => !isNonWorkingDay(d)).length;
    
    let totalEffort = 0;
    let warningDays = 0;
    
    projectMembers.forEach(member => {
      visibleDays.forEach(day => {
        if (isNonWorkingDay(day)) return;
        const dateStr = format(day, 'yyyy-MM-dd');
        const allocation = allocations.find(a => a.employee_id === member.employee_id && a.project_id === project.id && a.date === dateStr);
        const effort = allocation?.effort || 0;
        totalEffort += effort;
        
        const totalDayEffort = allocations.filter(a => a.employee_id === member.employee_id && a.date === dateStr).reduce((sum, a) => sum + Number(a.effort), 0);
        if (totalDayEffort > 1) warningDays++;
      });
    });
    
    const avgEffort = projectMembers.length > 0 ? totalEffort / projectMembers.length : 0;
    
    return { 
      totalEffort: Math.round(totalEffort * 10) / 10, 
      avgEffort: Math.round(avgEffort * 10) / 10, 
      workingDays,
      warningDays 
    };
  }, [project, columns, projectMembers, allocations]);

  const getEffort = (employeeId: string, column: typeof columns[0]) => {
    if (!project) return 0;
    
    if (!column.isAggregate) {
      const dateStr = format(column.date, 'yyyy-MM-dd');
      const allocation = allocations.find(a => a.employee_id === employeeId && a.project_id === project.id && a.date === dateStr);
      return allocation?.effort || 0;
    } else {
      let days: Date[] = [];
      if (viewMode === 'week') {
        const weekEnd = addDays(column.date, 6);
        days = eachDayOfInterval({ start: column.date, end: weekEnd });
      } else if (viewMode === 'month') {
        const monthEnd = endOfMonth(column.date);
        days = eachDayOfInterval({ start: column.date, end: monthEnd });
      } else if (viewMode === 'quarter') {
        const quarterEnd = endOfQuarter(column.date);
        days = eachDayOfInterval({ start: column.date, end: quarterEnd });
      }
      
      const total = days.reduce((sum, day) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const allocation = allocations.find(a => a.employee_id === employeeId && a.project_id === project.id && a.date === dateStr);
        return sum + (allocation?.effort || 0);
      }, 0);
      return Math.round(total * 10) / 10;
    }
  };

  const getTotalEffort = (employeeId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return allocations.filter(a => a.employee_id === employeeId && a.date === dateStr).reduce((sum, a) => sum + Number(a.effort), 0);
  };

  const getEmployeeAllocationsOnDate = (employeeId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return allocations.filter(a => a.employee_id === employeeId && a.date === dateStr);
  };

  const getAllocationSource = (employeeId: string, column: typeof columns[0]): 'gantt' | 'manual' | null => {
    if (!project || column.isAggregate) return null;
    const dateStr = format(column.date, 'yyyy-MM-dd');
    const allocation = allocations.find(a => a.employee_id === employeeId && a.project_id === project.id && a.date === dateStr);
    return allocation?.source || null;
  };

  // Single click to edit (only for day view and active members)
  const handleCellClick = (empId: string, colIdx: number, isActive: boolean) => {
    if (!isActive) return; // Don't allow editing inactive members
    const column = columns[colIdx];
    if (column.isAggregate) return;
    if (isNonWorkingDay(column.date)) return;
    
    const effort = getEffort(empId, column);
    setEditingCell({ empId, colIdx });
    setInputValue(effort > 0 ? effort.toString() : '');
  };

  const saveValue = async () => {
    if (!editingCell || !project) return;
    const column = columns[editingCell.colIdx];
    const value = parseFloat(inputValue) || 0;
    if (value < 0 || value > 1) { 
      toast.error('Effort phải từ 0 đến 1'); 
      return; 
    }
    await setAllocation.mutateAsync({ 
      employeeId: editingCell.empId, 
      projectId: project.id, 
      date: format(column.date, 'yyyy-MM-dd'), 
      effort: value,
      source: 'manual'
    });
    setEditingCell(null);
  };

  const moveToNextCell = (currentEmpId: string, currentColIdx: number) => {
    const activeMembersList = projectMembers.filter(m => m.is_active);
    const memberIdx = activeMembersList.findIndex(m => m.employee_id === currentEmpId);
    
    // Find next working day column
    for (let i = currentColIdx + 1; i < columns.length; i++) {
      if (!columns[i].isAggregate && !isNonWorkingDay(columns[i].date)) {
        const effort = getEffort(currentEmpId, columns[i]);
        setEditingCell({ empId: currentEmpId, colIdx: i });
        setInputValue(effort > 0 ? effort.toString() : '');
        return;
      }
    }
    // Move to next active member's first working day
    if (memberIdx < activeMembersList.length - 1) {
      const nextMember = activeMembersList[memberIdx + 1];
      for (let i = 0; i < columns.length; i++) {
        if (!columns[i].isAggregate && !isNonWorkingDay(columns[i].date)) {
          const effort = getEffort(nextMember.employee_id, columns[i]);
          setEditingCell({ empId: nextMember.employee_id, colIdx: i });
          setInputValue(effort > 0 ? effort.toString() : '');
          return;
        }
      }
    }
    setEditingCell(null);
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (!editingCell) return;
    
    if (e.key === 'Enter') { 
      e.preventDefault(); 
      await saveValue();
    } else if (e.key === 'Escape') { 
      setEditingCell(null); 
    } else if (e.key === 'Tab') {
      e.preventDefault();
      await saveValue();
      moveToNextCell(editingCell.empId, editingCell.colIdx);
    }
  };

  useEffect(() => { 
    if (editingCell && inputRef.current) { 
      inputRef.current.focus(); 
      inputRef.current.select(); 
    } 
  }, [editingCell]);

  // Fill range handlers
  const openFillRangeDialog = (empId: string, empName: string) => {
    setFillRangeDialog({ empId, empName });
    setFillStartDate(format(new Date(), 'yyyy-MM-dd'));
    setFillEndDate(format(addMonths(new Date(), 1), 'yyyy-MM-dd'));
    setFillEffort('1');
  };

  const handleFillRange = async () => {
    if (!fillRangeDialog || !project) return;
    
    const effort = parseFloat(fillEffort);
    if (isNaN(effort) || effort < 0 || effort > 1) {
      toast.error('Effort phải từ 0 đến 1');
      return;
    }

    try {
      const start = parse(fillStartDate, 'yyyy-MM-dd', new Date());
      const end = parse(fillEndDate, 'yyyy-MM-dd', new Date());
      
      if (start > end) {
        toast.error('Ngày bắt đầu phải trước ngày kết thúc');
        return;
      }

      const daysToFill = eachDayOfInterval({ start, end });
      const workingDays = daysToFill.filter(d => !isNonWorkingDay(d));

      const allocationsToSet = workingDays.map(day => ({
        employeeId: fillRangeDialog.empId,
        projectId: project.id,
        date: format(day, 'yyyy-MM-dd'),
        effort,
        source: 'manual' as const
      }));

      await bulkSetAllocations.mutateAsync(allocationsToSet);

      toast.success(`Đã điền effort cho ${workingDays.length} ngày làm việc`);
      setFillRangeDialog(null);
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  const handleAddSelectedMembers = async () => {
    if (!project || selectedMemberIds.size === 0) return;
    await addProjectMembers.mutateAsync({ 
      projectId: project.id, 
      employeeIds: Array.from(selectedMemberIds) 
    });
    setSelectedMemberIds(new Set());
    setMemberSearchQuery('');
    setShowMemberDialog(false);
  };

  const handleMemberDialogOpen = (open: boolean) => {
    if (open) {
      setMemberSearchQuery('');
      setSelectedMemberIds(new Set());
    }
    setShowMemberDialog(open);
  };

  const toggleMemberSelection = (empId: string) => {
    setSelectedMemberIds(prev => {
      const next = new Set(prev);
      if (next.has(empId)) {
        next.delete(empId);
      } else {
        next.add(empId);
      }
      return next;
    });
  };

  const filteredAvailableEmployees = availableEmployees.filter(emp => 
    emp.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
    emp.code?.toLowerCase().includes(memberSearchQuery.toLowerCase())
  );

  const handleToggleMemberStatus = async (memberId: string, currentStatus: boolean) => {
    if (!project) return;
    await toggleMemberStatus.mutateAsync({
      memberId,
      projectId: project.id,
      isActive: !currentStatus
    });
  };

  const handleRemoveMember = async () => {
    if (!deleteConfirmMember || !project) return;
    await removeProjectMember.mutateAsync({
      memberId: deleteConfirmMember.id,
      projectId: project.id,
      employeeId: deleteConfirmMember.employeeId
    });
    setDeleteConfirmMember(null);
  };

  const goToPrevious = () => {
    switch (viewMode) {
      case 'day': setStartDate(prev => addDays(prev, -30)); break;
      case 'week': setStartDate(prev => addWeeks(prev, -4)); break;
      case 'month': setStartDate(prev => addMonths(prev, -6)); break;
      case 'quarter': setStartDate(prev => addMonths(prev, -12)); break;
    }
  };
  
  const goToNext = () => {
    switch (viewMode) {
      case 'day': setStartDate(prev => addDays(prev, 30)); break;
      case 'week': setStartDate(prev => addWeeks(prev, 4)); break;
      case 'month': setStartDate(prev => addMonths(prev, 6)); break;
      case 'quarter': setStartDate(prev => addMonths(prev, 12)); break;
    }
  };
  
  const goToToday = () => setStartDate(new Date());

  if (projectLoading) return <MainLayout><div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div></MainLayout>;
  if (!project) return <MainLayout><div className="flex flex-col items-center justify-center h-96"><p className="text-muted-foreground">Không tìm thấy dự án</p><Button onClick={() => navigate('/projects')} className="mt-4">Quay lại</Button></div></MainLayout>;

  return (
    <MainLayout>
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => navigate('/projects')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: project.color }} />
            <div>
              <h1 className="text-base font-bold leading-tight">{project.name}</h1>
              <p className="text-[10px] text-muted-foreground">{project.code} • {format(new Date(project.start_date), 'dd/MM/yyyy')} - {format(new Date(project.end_date), 'dd/MM/yyyy')}</p>
            </div>
          </div>
          
          {/* Compact member display */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
                <Users className="w-3.5 h-3.5" />
                {projectMembers.length} thành viên
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-2" align="end">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium">Thành viên</span>
                <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setShowMemberDialog(true)}>
                  <UserPlus className="w-3 h-3 mr-1" />Thêm
                </Button>
              </div>
              {projectMembers.length === 0 ? (
                <p className="text-muted-foreground text-xs py-2 text-center">Chưa có thành viên</p>
              ) : (
                <div className="space-y-1 max-h-[250px] overflow-y-auto scrollbar-thin">
                  {projectMembers.map(m => (
                    <div 
                      key={m.id} 
                      className={cn(
                        "flex items-center justify-between px-2 py-1.5 rounded text-xs",
                        m.is_active ? "hover:bg-secondary/50" : "opacity-50 bg-muted/30"
                      )}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0",
                          m.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        )}>
                          {m.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="truncate block">{m.name}</span>
                          {!m.is_active && <span className="text-[10px] text-muted-foreground">(Inactive)</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Switch
                          checked={m.is_active}
                          onCheckedChange={() => handleToggleMemberStatus(m.id, m.is_active)}
                          className="scale-75"
                        />
                        <button 
                          onClick={() => setDeleteConfirmMember({ id: m.id, employeeId: m.employee_id, name: m.name })} 
                          className="text-muted-foreground hover:text-destructive p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* Project Stats Cards */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-card rounded-lg border border-border p-2 flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Thành viên</p>
              <p className="text-sm font-bold">{activeProjectMembers.length}/{projectMembers.length}</p>
            </div>
          </div>
          <div className="bg-card rounded-lg border border-border p-2 flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-green-500/10 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-green-500" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Tổng effort</p>
              <p className="text-sm font-bold">{projectStats.totalEffort} <span className="text-[10px] font-normal text-muted-foreground">man-days</span></p>
            </div>
          </div>
          <div className="bg-card rounded-lg border border-border p-2 flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">TB/người</p>
              <p className="text-sm font-bold">{projectStats.avgEffort} <span className="text-[10px] font-normal text-muted-foreground">man-days</span></p>
            </div>
          </div>
          <div className="bg-card rounded-lg border border-border p-2 flex items-center gap-2">
            <div className={cn("w-7 h-7 rounded-full flex items-center justify-center", projectStats.warningDays > 0 ? "bg-destructive/10" : "bg-muted")}>
              <AlertTriangle className={cn("w-3.5 h-3.5", projectStats.warningDays > 0 ? "text-destructive" : "text-muted-foreground")} />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Quá tải</p>
              <p className="text-sm font-bold">{projectStats.warningDays}</p>
            </div>
          </div>
        </div>

        {/* Tabs for Effort/Gantt */}
        <Tabs value={tabMode} onValueChange={(v) => setTabMode(v as TabMode)} className="flex-1 flex flex-col">
          {/* Fullscreen overlay container */}
          <div className={cn(
            isFullscreen && "fixed inset-0 z-50 bg-background p-4 flex flex-col"
          )}>
            {/* Fullscreen header */}
            {isFullscreen && (
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: project.color }} />
                    <span className="text-sm font-bold">{project.name}</span>
                    <span className="text-xs text-muted-foreground">({project.code})</span>
                  </div>
                  <TabsList className="w-fit h-7">
                    <TabsTrigger value="gantt" className="h-6 text-xs gap-1">
                      <GanttChartSquare className="w-3 h-3" /> Tiến độ (Gantt)
                    </TabsTrigger>
                    <TabsTrigger value="effort" className="h-6 text-xs gap-1">
                      <LayoutGrid className="w-3 h-3" /> Nguồn lực
                    </TabsTrigger>
                  </TabsList>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-7 w-7 p-0"
                  onClick={() => setIsFullscreen(false)}
                  title="Thu nhỏ (Esc)"
                >
                  <Minimize2 className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Normal mode tabs header */}
            {!isFullscreen && (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <TabsList className="w-fit h-7">
                    <TabsTrigger value="gantt" className="h-6 text-xs gap-1">
                      <GanttChartSquare className="w-3 h-3" /> Tiến độ (Gantt)
                    </TabsTrigger>
                    <TabsTrigger value="effort" className="h-6 text-xs gap-1">
                      <LayoutGrid className="w-3 h-3" /> Nguồn lực
                    </TabsTrigger>
                  </TabsList>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0 bg-primary/10 hover:bg-primary/20"
                    onClick={() => setIsFullscreen(true)}
                    title="Phóng to toàn màn hình"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-primary" />
                  </Button>
                </div>
                
                {/* Last sync info - shown only on Nguồn lực tab */}
                {tabMode === 'effort' && project?.last_sync_at && (
                  <div className="text-[10px] text-muted-foreground">
                    Cập nhật lần cuối lúc {format(new Date(project.last_sync_at), 'HH:mm dd/MM/yyyy', { locale: vi })}
                    {project.last_sync_by && (() => {
                      const syncUser = users.find(u => u.id === project.last_sync_by);
                      return syncUser ? ` bởi ${syncUser.full_name || syncUser.email}` : '';
                    })()}
                  </div>
                )}
              </div>
            )}

          <TabsContent value="effort" className={cn("mt-2 flex-1", isFullscreen ? "mb-0" : "mb-5")}>
            {/* Effort Table */}
            <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="p-1.5 border-b border-border flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={goToPrevious}><ChevronLeft className="w-3.5 h-3.5" /></Button>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={goToToday}>Hôm nay</Button>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={goToNext}><ChevronRight className="w-3.5 h-3.5" /></Button>
            </div>
            
            {/* View mode selector */}
            <div className="flex gap-0.5 bg-secondary/50 p-0.5 rounded">
              {(['day', 'week', 'month', 'quarter'] as ViewMode[]).map(m => (
                <button key={m} onClick={() => setViewMode(m)} className={cn('px-1.5 py-0.5 text-[10px] rounded', viewMode === m ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>
                  {m === 'day' ? 'Ngày' : m === 'week' ? 'Tuần' : m === 'month' ? 'Tháng' : 'Quý'}
                </button>
              ))}
            </div>

            {/* Date range picker for viewing */}
            <DateRangePickerPopup
              startDate={viewMode === 'custom' ? customStartDate : startDate}
              endDate={viewMode === 'custom' ? customEndDate : (viewMode === 'day' ? addMonths(startDate, 3) : viewMode === 'week' ? addMonths(startDate, 3) : viewMode === 'month' ? addMonths(startDate, 12) : addMonths(startDate, 24))}
              onRangeChange={(start, end) => {
                setCustomStartDate(start);
                setCustomEndDate(end);
                setViewMode('custom');
              }}
            />
          </div>

          {projectMembers.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-xs">
              Thêm thành viên để bắt đầu điền effort
            </div>
          ) : (
            <div ref={tableScrollRef} className={cn("overflow-x-auto overflow-y-auto scrollbar-thin", isFullscreen ? "max-h-[calc(100vh-140px)]" : "max-h-[calc(100vh-300px)]")}>
              <table className="w-full min-w-max">
                <thead>
                  <tr className="bg-secondary/50">
                    <th className="sticky left-0 bg-secondary z-10 px-2 py-1.5 text-left text-[10px] font-semibold min-w-[140px]">Thành viên</th>
                    <th className="sticky left-[140px] bg-secondary z-10 px-2 py-1.5 text-left text-[10px] font-semibold min-w-[100px]">Vị trí</th>
                    {columns.map((col, idx) => {
                      const isTodayCol = !col.isAggregate && isSameDay(col.date, new Date());
                      return (
                      <th key={idx} className={cn(
                        'px-0.5 py-1 text-center text-[9px]',
                        columnWidth,
                        !col.isAggregate && isNonWorkingDay(col.date) && 'bg-muted-foreground/30',
                        !col.isAggregate && isHoliday(col.date) && 'bg-muted-foreground/30',
                        isTodayCol && 'bg-primary/10',
                        isTodayCol && '!border-l-2 !border-l-red-500'
                      )}>
                        <div className="text-muted-foreground">{col.subLabel}</div>
                        <div className="font-medium">{col.label}</div>
                      </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {projectMembers.map((member, idx) => {
                    const rowBg = idx % 2 === 0 ? 'bg-card' : 'bg-muted';
                    const isInactive = !member.is_active;
                    return (
                    <tr 
                      key={member.id} 
                      className={cn(
                        'border-t border-border', 
                        rowBg,
                        isInactive && 'opacity-50'
                      )} 
                      style={{ height: '26px' }}
                      title={isInactive ? 'Thành viên đã inactive, không thể chỉnh sửa effort' : undefined}
                    >
                      <td className={cn('sticky left-0 z-10 px-2 py-1', rowBg, isInactive && 'opacity-50')}>
                        <div className="flex items-center gap-1.5">
                          <div className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold",
                            isInactive ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                          )}>
                            {member.name.charAt(0)}
                          </div>
                          <span className="text-[11px] font-medium truncate max-w-[90px]">{member.name}</span>
                          {!isInactive && (
                            <button 
                              onClick={() => openFillRangeDialog(member.employee_id, member.name)}
                              className="ml-auto text-muted-foreground hover:text-primary opacity-50 hover:opacity-100"
                              title="Điền effort theo khoảng thời gian"
                            >
                              <Calendar className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className={cn('sticky left-[140px] z-10 px-2 py-1', rowBg, isInactive && 'opacity-50')}>
                        <span className="text-[10px] text-muted-foreground truncate block max-w-[90px]">{member.position || '-'}</span>
                      </td>
                      {columns.map((col, colIdx) => {
                        const effort = getEffort(member.employee_id, col);
                        const isEditing = editingCell?.empId === member.employee_id && editingCell?.colIdx === colIdx;
                        const isDisabled = !col.isAggregate && isNonWorkingDay(col.date);
                        const isOver = !col.isAggregate && getTotalEffort(member.employee_id, col.date) > 1;
                        const allocationSource = getAllocationSource(member.employee_id, col);
                        const isManualEdit = allocationSource === 'manual';

                        return (
                          <td 
                            key={colIdx} 
                            className={cn(
                              'p-0 text-center',
                              columnWidth,
                              isDisabled && 'bg-muted-foreground/30 cursor-not-allowed',
                              !col.isAggregate && isHoliday(col.date) && 'bg-muted-foreground/30',
                              !isDisabled && !col.isAggregate && effort > 0 && !isManualEdit && 'bg-primary/10',
                              !isDisabled && !col.isAggregate && effort > 0 && isManualEdit && 'bg-orange-400/30',
                              isOver && !isDisabled && 'bg-destructive/20',
                              col.isAggregate && 'bg-secondary/30',
                              !isDisabled && !col.isAggregate && !isEditing && !isInactive && 'cursor-cell hover:ring-1 hover:ring-primary/50 hover:ring-inset',
                              isInactive && 'cursor-not-allowed',
                              !col.isAggregate && isSameDay(col.date, new Date()) && '!border-l-2 !border-l-red-500'
                            )}
                            style={{ height: '26px' }}
                            onClick={() => !col.isAggregate && !isDisabled && handleCellClick(member.employee_id, colIdx, member.is_active)}
                          >
                            {isEditing ? (
                              <input 
                                ref={inputRef} 
                                type="number" 
                                min="0" 
                                max="1" 
                                step="0.1" 
                                value={inputValue} 
                                onChange={(e) => setInputValue(e.target.value)} 
                                onBlur={saveValue} 
                                onKeyDown={handleKeyDown} 
                                className="w-full h-full text-center bg-background border-2 border-primary outline-none text-[10px]" 
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center relative">
                                {effort > 0 ? (
                                  <span className={cn('text-[9px] font-medium', col.isAggregate && 'text-muted-foreground')}>{effort}</span>
                                ) : (
                                  <span className="text-[9px] text-muted-foreground/20">-</span>
                                )}
                                {isOver && !isDisabled && (
                                  <AllocationConflictTooltip
                                    employeeId={member.employee_id}
                                    date={col.date}
                                    allocations={getEmployeeAllocationsOnDate(member.employee_id, col.date)}
                                    projects={allProjects}
                                    currentProjectId={project.id}
                                    totalEffort={getTotalEffort(member.employee_id, col.date)}
                                    className="absolute top-0 right-0"
                                  />
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
            </div>
          </TabsContent>

          <TabsContent value="gantt" className={cn("mt-2 flex-1", isFullscreen ? "mb-0" : "mb-5")}>
            <div className={cn("bg-card rounded-lg border border-border overflow-hidden", isFullscreen ? "h-[calc(100vh-100px)]" : "h-[calc(100vh-240px)]")}>
              <GanttView 
                projectId={project.id} 
                projectMembers={activeProjectMembers.map(m => ({ id: m.employee_id, name: m.name }))}
                holidays={holidays}
                settings={settings}
              />
            </div>
          </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Add Member Dialog */}
      <Dialog open={showMemberDialog} onOpenChange={handleMemberDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-sm">Thêm thành viên</DialogTitle></DialogHeader>
          
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm nhân viên..."
              value={memberSearchQuery}
              onChange={(e) => setMemberSearchQuery(e.target.value)}
              className="h-8 text-xs pl-8"
            />
          </div>
          
          {/* Employee list with checkboxes */}
          <div className="space-y-1 max-h-[250px] overflow-y-auto scrollbar-thin">
            {filteredAvailableEmployees.length === 0 ? (
              <p className="text-muted-foreground text-xs py-4 text-center">
                {availableEmployees.length === 0 ? 'Tất cả đã được thêm' : 'Không tìm thấy'}
              </p>
            ) : (
              filteredAvailableEmployees.map(emp => (
                <div 
                  key={emp.id} 
                  className={cn(
                    "flex items-center gap-2 p-2 rounded border cursor-pointer text-xs transition-colors",
                    selectedMemberIds.has(emp.id) 
                      ? "border-primary bg-primary/10" 
                      : "border-border hover:bg-secondary/50"
                  )}
                  onClick={() => toggleMemberSelection(emp.id)}
                >
                  <div className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                    selectedMemberIds.has(emp.id) 
                      ? "bg-primary border-primary text-primary-foreground" 
                      : "border-muted-foreground/30"
                  )}>
                    {selectedMemberIds.has(emp.id) && <Check className="w-3 h-3" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{emp.name}</div>
                    {emp.position && <div className="text-muted-foreground truncate">{emp.position}</div>}
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Add button */}
          <DialogFooter>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowMemberDialog(false)}
              className="text-xs"
            >
              Hủy
            </Button>
            <Button 
              size="sm" 
              onClick={handleAddSelectedMembers}
              disabled={selectedMemberIds.size === 0}
              className="text-xs"
            >
              <UserPlus className="w-3.5 h-3.5 mr-1" />
              Thêm ({selectedMemberIds.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fill Range Dialog */}
      <Dialog open={!!fillRangeDialog} onOpenChange={(open) => !open && setFillRangeDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Điền effort - {fillRangeDialog?.empName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px]">Từ ngày</Label>
                <Input 
                  type="date" 
                  value={fillStartDate} 
                  onChange={(e) => setFillStartDate(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Đến ngày</Label>
                <Input 
                  type="date" 
                  value={fillEndDate} 
                  onChange={(e) => setFillEndDate(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Effort (0-1)</Label>
              <Input 
                type="number" 
                min="0" 
                max="1" 
                step="0.1" 
                value={fillEffort} 
                onChange={(e) => setFillEffort(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Tự động bỏ qua ngày nghỉ lễ và cuối tuần
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setFillRangeDialog(null)}>Hủy</Button>
            <Button size="sm" className="h-7 text-xs" onClick={handleFillRange}>Điền effort</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmMember} onOpenChange={(open) => !open && setDeleteConfirmMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Xác nhận xóa thành viên
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Bạn có chắc muốn xóa <strong>{deleteConfirmMember?.name}</strong> khỏi dự án?
              </p>
              <p className="text-destructive font-medium">
                ⚠️ Tất cả dữ liệu effort của thành viên này trong dự án sẽ bị xóa vĩnh viễn và không thể khôi phục.
              </p>
              <p className="text-muted-foreground">
                💡 Gợi ý: Nếu chỉ muốn tạm ngưng, hãy sử dụng chức năng "Inactive" thay vì xóa.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa thành viên
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
