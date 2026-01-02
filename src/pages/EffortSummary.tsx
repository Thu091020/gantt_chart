import { useState, useMemo, Fragment, useEffect } from 'react';
import { useTableScroll } from '@/hooks/useTableScroll';
import { useEmployees } from '@/hooks/useEmployees';
import { useProjects } from '@/hooks/useProjects';
import { useAllocations, useSetAllocation, AllocationQueryParams } from '@/hooks/useAllocations';
import { useAllocationDateBounds } from '@/hooks/useAllocationDateBounds';
import { useHolidays } from '@/hooks/useHolidays';
import { useSettings, isSaturdayWorkingDay } from '@/hooks/useSettings';
import { useViewSettings, useSaveViewSettings } from '@/hooks/useViewSettings';
import { useAllProjectMembers } from '@/hooks/useProjectMembers';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { format, addMonths, subWeeks, isSameDay, eachDayOfInterval, differenceInDays, isSaturday, isSunday } from 'date-fns';
import { vi } from 'date-fns/locale';
import { AlertTriangle, ChevronDown, ChevronUp, Loader2, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EffortConflictTooltip } from '@/components/effort/EffortConflictTooltip';
import { toast } from 'sonner';
import { DateRangePicker } from '@/components/common/DateRangePicker';
import { ProjectMultiSelect } from '@/components/common/ProjectMultiSelect';
import { DepartmentMultiSelect } from '@/components/common/DepartmentMultiSelect';
import { EmployeeMultiSelect } from '@/components/common/EmployeeMultiSelect';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface EffortDetail {
  projectId: string;
  projectName: string;
  projectColor: string;
  effort: number;
}

export default function EffortSummary() {
  const { data: employees = [], isLoading: employeesLoading } = useEmployees();
  const { data: projects = [] } = useProjects();
  const { data: holidays = [] } = useHolidays();
  const { data: settings } = useSettings();
  const { data: viewSettings } = useViewSettings();
  const { data: allProjectMembers = [] } = useAllProjectMembers();
  const saveViewSettings = useSaveViewSettings();
  const setAllocation = useSetAllocation();
  
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set());
  const [customStartDate, setCustomStartDate] = useState<Date>(() => subWeeks(new Date(), 1));
  const [customEndDate, setCustomEndDate] = useState<Date>(() => addMonths(new Date(), 3));
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [editDialog, setEditDialog] = useState<{
    employeeId: string;
    employeeName: string;
    date: string;
    projectId?: string;
    projectName?: string;
    projectColor?: string;
    effort: number;
    isTotal?: boolean;
    details?: EffortDetail[];
  } | null>(null);

  // Load saved settings on mount
  useEffect(() => {
    if (viewSettings?.effortSummary && !settingsLoaded) {
      const saved = viewSettings.effortSummary;
      if (saved.startDate) setCustomStartDate(new Date(saved.startDate));
      if (saved.endDate) setCustomEndDate(new Date(saved.endDate));
      setSettingsLoaded(true);
    }
  }, [viewSettings, settingsLoaded]);

  // Save settings when date range changes
  useEffect(() => {
    if (!settingsLoaded) return;
    
    const timer = setTimeout(() => {
      saveViewSettings.mutate({
        ...viewSettings,
        effortSummary: {
          startDate: customStartDate.toISOString(),
          endDate: customEndDate.toISOString(),
        }
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [customStartDate, customEndDate, settingsLoaded]);

  // Fetch allocations with date range filter
  const allocationsQuery = useMemo(() => {
    const baseQuery: AllocationQueryParams = {
      startDate: format(customStartDate, 'yyyy-MM-dd'),
      endDate: format(customEndDate, 'yyyy-MM-dd'),
    };
    return baseQuery;
  }, [customStartDate, customEndDate]);

  const { data: allocations = [], isLoading: allocationsLoading } = useAllocations(allocationsQuery);

  // Khi lọc đúng 1 dự án: tự động mở rộng endDate để bao phủ toàn bộ dữ liệu nguồn lực của dự án đó
  const selectedSingleProjectId = selectedProjectIds.length === 1 ? selectedProjectIds[0] : undefined;
  const { data: allocationBounds } = useAllocationDateBounds(selectedSingleProjectId);

  useEffect(() => {
    if (!selectedSingleProjectId) return;
    if (!allocationBounds?.maxDate) return;

    const max = new Date(allocationBounds.maxDate);
    if (Number.isNaN(max.getTime())) return;

    // Nếu bảng đang bị cắt ngắn (ví dụ chỉ tới 27/01) thì tự mở rộng tới ngày có allocation cuối cùng
    if (max > customEndDate) {
      setCustomEndDate(max);
    }
  }, [selectedSingleProjectId, allocationBounds?.maxDate, customEndDate]);

  const tableScrollRef = useTableScroll<HTMLDivElement>({ maxHeight: 'calc(100vh - 280px)' });
  const isLoading = employeesLoading || allocationsLoading;

  // Get unique departments
  const departments = useMemo(() => {
    const depts = new Set<string>();
    employees.forEach(e => {
      if (e.department) depts.add(e.department);
    });
    return Array.from(depts).sort();
  }, [employees]);

  // Only show active employees in resource summary, filtered by department, individual selection, and project membership/allocation
  const activeEmployees = useMemo(() => {
    let filtered = employees.filter(e => e.is_active);

    // Filter by department
    if (selectedDepartments.length > 0) {
      filtered = filtered.filter(e => e.department && selectedDepartments.includes(e.department));
    }

    // Filter by individual employee selection
    if (selectedEmployeeIds.length > 0) {
      filtered = filtered.filter(e => selectedEmployeeIds.includes(e.id));
    }

    // Filter by project - include employees who are members OR have allocations in selected projects (đồng bộ theo bảng nguồn lực)
    if (selectedProjectIds.length > 0) {
      const employeeIdsFromMembers = new Set(
        allProjectMembers
          .filter(pm => selectedProjectIds.includes(pm.project_id))
          .map(pm => pm.employee_id)
      );

      const employeeIdsFromAllocations = new Set(
        allocations
          .filter(a => selectedProjectIds.includes(a.project_id) && Number(a.effort) > 0)
          .map(a => a.employee_id)
      );

      const employeeIdsInSelectedProjects = new Set<string>([
        ...employeeIdsFromMembers,
        ...employeeIdsFromAllocations,
      ]);

      filtered = filtered.filter(e => employeeIdsInSelectedProjects.has(e.id));
    }

    return filtered;
  }, [employees, selectedDepartments, selectedEmployeeIds, selectedProjectIds, allProjectMembers, allocations]);

  // Filter projects based on selection
  const filteredProjects = useMemo(() => {
    if (selectedProjectIds.length === 0) return projects;
    return projects.filter(p => selectedProjectIds.includes(p.id));
  }, [projects, selectedProjectIds]);

  const handleCustomRangeChange = (start: Date, end: Date) => {
    setCustomStartDate(start);
    setCustomEndDate(end);
  };

  const { columns, columnWidth } = useMemo(() => {
    const days = eachDayOfInterval({ start: customStartDate, end: customEndDate });
    const dayCount = differenceInDays(customEndDate, customStartDate) + 1;
    const width = dayCount <= 14 ? 'min-w-[56px]' : dayCount <= 31 ? 'min-w-[40px]' : 'min-w-[32px]';
    return {
      columns: days.map(d => ({ date: d, label: format(d, 'dd/MM'), subLabel: format(d, 'EEE', { locale: vi }) })),
      columnWidth: width,
    };
  }, [customStartDate, customEndDate]);

  // Debug info (also rendered in UI)
  const allocationsMaxDate = useMemo(() => {
    let max: string | null = null;
    for (const a of allocations) {
      if (!max || a.date > max) max = a.date;
    }
    return max;
  }, [allocations]);

  // Use warn so it shows up in captured logs
  useEffect(() => {
    const last = columns[columns.length - 1]?.date;
    console.warn('[EffortSummary] debug', {
      range: {
        start: format(customStartDate, 'yyyy-MM-dd'),
        end: format(customEndDate, 'yyyy-MM-dd'),
        columns: columns.length,
        last: last ? format(last, 'yyyy-MM-dd') : null,
      },
      allocations: {
        rows: allocations.length,
        maxDate: allocationsMaxDate,
      },
      selectedProjects: selectedProjectIds,
    });
  }, [customStartDate, customEndDate, columns, allocations.length, allocationsMaxDate, selectedProjectIds]);

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
    if (isSaturday(date)) {
      if (settings && isSaturdayWorkingDay(date, settings)) {
        return false;
      }
      return true;
    }
    return false;
  };

  const isNonWorkingWeekend = (date: Date) => {
    if (isSunday(date)) return true;
    if (isSaturday(date)) {
      if (settings && isSaturdayWorkingDay(date, settings)) {
        return false;
      }
      return true;
    }
    return false;
  };

  // Lấy chi tiết effort của nhân viên - KHÔNG lọc theo dự án, hiển thị TẤT CẢ dự án nhân viên tham gia
  const getEffortDetails = (employeeId: string, date: Date): EffortDetail[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    return allocations
      .filter(a => a.employee_id === employeeId && a.date === dateStr && Number(a.effort) > 0)
      .map(a => {
        const project = projects.find(p => p.id === a.project_id);
        return {
          projectId: a.project_id,
          projectName: project?.name || 'Unknown',
          projectColor: project?.color || '#888',
          effort: Number(a.effort)
        };
      });
  };

  // Tổng effort của nhân viên - KHÔNG lọc theo dự án, tính TẤT CẢ dự án
  const getTotalEffort = (employeeId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return allocations
      .filter(a => a.employee_id === employeeId && a.date === dateStr)
      .reduce((sum, a) => sum + Number(a.effort), 0);
  };

  const getProjectEffort = (employeeId: string, projectId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const allocation = allocations.find(
      a => a.employee_id === employeeId && a.project_id === projectId && a.date === dateStr
    );
    return allocation ? Number(allocation.effort) : 0;
  };

  const handleTotalCellClick = (employeeId: string, employeeName: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const existingDetails = getEffortDetails(employeeId, date);
    
    // Lấy danh sách project mà nhân viên có allocation hoặc là member
    const employeeProjectIds = new Set<string>();
    
    // Thêm từ allocations
    allocations.forEach(a => {
      if (a.employee_id === employeeId) {
        employeeProjectIds.add(a.project_id);
      }
    });
    
    // Thêm từ members field (nếu có)
    projects.forEach(p => {
      if (p.members?.includes(employeeId)) {
        employeeProjectIds.add(p.id);
      }
    });
    
    const employeeProjects = projects.filter(p => employeeProjectIds.has(p.id));
    
    const details: EffortDetail[] = employeeProjects.map(p => {
      const existing = existingDetails.find(d => d.projectId === p.id);
      return existing || {
        projectId: p.id,
        projectName: p.name,
        projectColor: p.color,
        effort: 0
      };
    });
    
    if (details.length === 0) {
      toast.info('Nhân viên chưa được thêm vào dự án nào');
      return;
    }
    
    setEditDialog({
      employeeId,
      employeeName,
      date: dateStr,
      effort: 0,
      isTotal: true,
      details
    });
  };

  const handleProjectCellClick = (employeeId: string, employeeName: string, projectId: string, projectName: string, projectColor: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const currentEffort = getProjectEffort(employeeId, projectId, date);
    
    setEditDialog({
      employeeId,
      employeeName,
      date: dateStr,
      projectId,
      projectName,
      projectColor,
      effort: currentEffort,
      isTotal: false
    });
  };

  const handleEffortChange = (projectId: string, newEffort: number) => {
    if (editDialog && editDialog.isTotal && editDialog.details) {
      const updatedDetails = editDialog.details.map(d =>
        d.projectId === projectId ? { ...d, effort: newEffort } : d
      );
      setEditDialog({ ...editDialog, details: updatedDetails });
    }
  };

  const handleSaveEffort = async () => {
    if (editDialog) {
      if (editDialog.isTotal && editDialog.details) {
        for (const d of editDialog.details) {
          await setAllocation.mutateAsync({
            employeeId: editDialog.employeeId,
            projectId: d.projectId,
            date: editDialog.date,
            effort: d.effort
          });
        }
      } else if (editDialog.projectId) {
        await setAllocation.mutateAsync({
          employeeId: editDialog.employeeId,
          projectId: editDialog.projectId,
          date: editDialog.date,
          effort: editDialog.effort
        });
      }
      toast.success('Đã cập nhật effort');
      setEditDialog(null);
    }
  };

  const warnings = useMemo(() => {
    const result: { employeeId: string; employeeName: string; date: string; total: number; type: 'over' | 'under' }[] = [];
    activeEmployees.forEach(emp => {
      columns.forEach(col => {
        if (!isNonWorkingDay(col.date)) {
          const total = getTotalEffort(emp.id, col.date);
          if (total > 1) {
            result.push({
              employeeId: emp.id,
              employeeName: emp.name,
              date: format(col.date, 'dd/MM/yyyy'),
              total,
              type: 'over'
            });
          } else if (total > 0 && total < 1) {
            result.push({
              employeeId: emp.id,
              employeeName: emp.name,
              date: format(col.date, 'dd/MM/yyyy'),
              total,
              type: 'under'
            });
          }
        }
      });
    });
    return result;
  }, [activeEmployees, columns, allocations, holidays, settings]);

  const overWarnings = warnings.filter(w => w.type === 'over');
  const underWarnings = warnings.filter(w => w.type === 'under');

  return (
    <MainLayout>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Tổng hợp Effort</h1>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {overWarnings.length > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-destructive/10 border border-destructive/30 rounded-lg text-xs">
                <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                <span className="text-destructive font-medium">{overWarnings.length} quá tải (&gt;1)</span>
              </div>
            )}
            {underWarnings.length > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-warning/10 border border-warning/30 rounded-lg text-xs">
                <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                <span className="text-warning font-medium">{underWarnings.length} thiếu effort (&lt;1)</span>
              </div>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-card rounded-lg border border-border">
          <div className="flex items-center gap-2 flex-wrap">
            <DateRangePicker
              startDate={customStartDate}
              endDate={customEndDate}
              onRangeChange={handleCustomRangeChange}
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground"
              onClick={() => {
                const start = subWeeks(new Date(), 1);
                const end = addMonths(new Date(), 3);
                setCustomStartDate(start);
                setCustomEndDate(end);
                // Also clear saved settings
                saveViewSettings.mutate({
                  ...viewSettings,
                  effortSummary: {
                    startDate: start.toISOString(),
                    endDate: end.toISOString(),
                  }
                });
              }}
            >
              Refresh
            </Button>
            <span className="text-[10px] text-muted-foreground">
              ({columns.length} ngày) • loaded tới: {allocationsMaxDate || '—'} ({allocations.length} rows)
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <DepartmentMultiSelect
              departments={departments}
              selectedDepartments={selectedDepartments}
              onChange={setSelectedDepartments}
            />
            <EmployeeMultiSelect
              employees={employees.filter(e => e.is_active)}
              selectedIds={selectedEmployeeIds}
              onChange={setSelectedEmployeeIds}
            />
            <ProjectMultiSelect
              projects={projects}
              selectedIds={selectedProjectIds}
              onChange={setSelectedProjectIds}
            />
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => setExpandedEmployees(new Set(activeEmployees.map(e => e.id)))}
              >
                <ChevronDown className="w-3 h-3" />
                Mở tất cả
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => setExpandedEmployees(new Set())}
              >
                <ChevronUp className="w-3 h-3" />
                Thu gọn
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Table */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div ref={tableScrollRef} className="overflow-x-auto overflow-y-auto scrollbar-thin">
              <table className="w-full min-w-max border-collapse">
                <thead className="sticky top-0 z-40">
                  <tr className="bg-secondary/70">
                    <th className="sticky left-0 z-50 px-3 py-2 text-left font-semibold text-sm min-w-[180px] bg-secondary border-r border-primary/20">
                      Nhân viên
                    </th>
                    {columns.map(col => {
                      const isHolidayCol = isHoliday(col.date);
                      const isNonWorkingWeekendCol = isNonWorkingWeekend(col.date);
                      const isTodayCol = isSameDay(col.date, new Date());
                      
                      return (
                        <th
                          key={col.date.toISOString()}
                          className={cn(
                            'px-0.5 py-2 text-center font-medium border-l border-border/50 bg-secondary relative',
                            columnWidth,
                            (isNonWorkingWeekendCol || isHolidayCol) && '!bg-muted',
                            isTodayCol && !isHolidayCol && !isNonWorkingWeekendCol && '!bg-primary/15',
                            isTodayCol && '!border-l-2 !border-l-red-500'
                          )}
                        >
                          <div className={cn(
                            "text-[9px] uppercase tracking-wider font-medium",
                            (isHolidayCol || isNonWorkingWeekendCol) ? 'text-muted-foreground' : 'text-muted-foreground'
                          )}>
                            {col.subLabel}
                          </div>
                          <div className={cn(
                            "text-xs font-semibold",
                            isTodayCol && !isHolidayCol && !isNonWorkingWeekendCol && 'text-primary'
                          )}>
                            {col.label}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {activeEmployees.map((employee, idx) => {
                    const isExpanded = expandedEmployees.has(employee.id);
                    const employeeProjects = filteredProjects.filter(p => {
                      return allocations.some(a => a.employee_id === employee.id && a.project_id === p.id);
                    });
                    const bgClass = idx % 2 === 0 ? 'bg-card' : 'bg-muted';
                    
                    return (
                      <Fragment key={employee.id}>
                        <tr className={cn('border-t border-border/50 hover:bg-accent/20', bgClass)}>
                          <td className={cn('sticky left-0 z-20 px-3 py-1.5 border-r border-primary/20', bgClass)}>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  const newSet = new Set(expandedEmployees);
                                  if (isExpanded) {
                                    newSet.delete(employee.id);
                                  } else {
                                    newSet.add(employee.id);
                                  }
                                  setExpandedEmployees(newSet);
                                }}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                {employee.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium text-sm text-foreground">{employee.name}</p>
                                <p className="text-[10px] text-muted-foreground">{employee.code}</p>
                              </div>
                            </div>
                          </td>
                          {columns.map(col => {
                            const total = getTotalEffort(employee.id, col.date);
                            const isHolidayDay = isHoliday(col.date);
                            const isNonWorkingWeekendDay = isNonWorkingWeekend(col.date);
                            const isDisabled = isNonWorkingDay(col.date);
                            const isOverloaded = total > 1;
                            const isUnderloaded = total > 0 && total < 1;
                            const canClick = !isDisabled;
                            const isTodayCell = isSameDay(col.date, new Date());

                            const isFullEffort = total === 1;

                            return (
                              <td
                                key={col.date.toISOString()}
                                className={cn(
                                  'p-0.5 text-center transition-colors border-l border-border/30',
                                  (isNonWorkingWeekendDay || isHolidayDay) && 'bg-muted-foreground/20',
                                  !isDisabled && isFullEffort && 'bg-blue-100 dark:bg-blue-900/30',
                                  !isDisabled && isUnderloaded && 'bg-warning/20',
                                  isOverloaded && !isDisabled && 'bg-destructive/25',
                                  canClick && 'cursor-pointer hover:ring-1 hover:ring-primary/50',
                                  isTodayCell && '!border-l-2 !border-l-red-500'
                                )}
                                onClick={() => canClick && handleTotalCellClick(employee.id, employee.name, col.date)}
                              >
                                <div className="w-full h-7 flex items-center justify-center relative">
                                  {total > 0 ? (
                                    <span className={cn(
                                      'text-xs font-bold',
                                      isOverloaded && 'text-destructive',
                                      isUnderloaded && 'text-warning'
                                    )}>
                                      {total.toFixed(1)}
                                    </span>
                                  ) : canClick ? (
                                    <Edit3 className="w-2.5 h-2.5 text-muted-foreground/30" />
                                  ) : (
                                    <span className="text-xs text-muted-foreground/40">-</span>
                                  )}
                                  {isOverloaded && !isDisabled && (
                                    <EffortConflictTooltip
                                      totalEffort={total}
                                      details={getEffortDetails(employee.id, col.date)}
                                      className="absolute top-0 right-0"
                                    />
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                        
                        {/* Expanded details */}
                        {isExpanded && (
                          employeeProjects.map(project => (
                            <tr key={`${employee.id}-${project.id}`} className="border-t border-border/30 bg-muted">
                              <td className="sticky left-0 z-20 px-3 py-1 pl-12 bg-muted border-r border-primary/20">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{ backgroundColor: project.color }}
                                  />
                                  <span className="text-xs text-muted-foreground">{project.name}</span>
                                </div>
                              </td>
                              {columns.map(col => {
                                const effort = getProjectEffort(employee.id, project.id, col.date);
                                const isHolidayDay = isHoliday(col.date);
                                const isNonWorkingWeekendDay = isNonWorkingWeekend(col.date);
                                const isDisabled = isNonWorkingDay(col.date);
                                const canClick = !isDisabled;
                                const isTodayCell = isSameDay(col.date, new Date());

                                return (
                                  <td
                                    key={col.date.toISOString()}
                                    className={cn(
                                      'p-0.5 text-center border-l border-border/30',
                                      (isNonWorkingWeekendDay || isHolidayDay) && 'bg-muted-foreground/20',
                                      canClick && 'cursor-pointer hover:ring-1 hover:ring-primary/50',
                                      isTodayCell && '!border-l-2 !border-l-red-500'
                                    )}
                                    onClick={() => canClick && handleProjectCellClick(employee.id, employee.name, project.id, project.name, project.color, col.date)}
                                  >
                                    <div 
                                      className="w-full h-6 flex items-center justify-center rounded-sm"
                                      style={effort > 0 && !isDisabled ? { backgroundColor: `${project.color}25` } : undefined}
                                    >
                                      <span className="text-xs font-medium text-foreground">
                                        {effort > 0 ? effort : canClick ? <Edit3 className="w-2 h-2 text-muted-foreground/30" /> : '-'}
                                      </span>
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          ))
                        )}
                      </Fragment>
                    );
                  })}
                  {employees.length === 0 && (
                    <tr>
                      <td colSpan={columns.length + 1} className="text-center py-6 text-muted-foreground text-sm">
                        Chưa có nhân viên nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 px-3 py-2 bg-card rounded-lg border border-border text-xs">
          <span className="font-medium text-foreground">Chú thích:</span>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-warning/20 border border-warning/40" />
            <span className="text-muted-foreground">&lt;1</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-destructive/25 border border-destructive/40" />
            <span className="text-muted-foreground">&gt;1</span>
          </div>
          <div className="h-3 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-muted border border-border" />
            <span className="text-muted-foreground">Nghỉ</span>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editDialog} onOpenChange={() => setEditDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">
              {editDialog?.isTotal ? 'Điều chỉnh effort' : `Effort - ${editDialog?.projectName}`}
            </DialogTitle>
          </DialogHeader>
          <div className="text-xs text-muted-foreground mb-3">
            <strong>{editDialog?.employeeName}</strong> - {editDialog?.date && format(new Date(editDialog.date), 'EEEE, dd/MM/yyyy', { locale: vi })}
          </div>
          
          <div className="space-y-3">
            {editDialog?.isTotal && editDialog?.details ? (
              <>
                {editDialog.details.map(d => (
                  <div key={d.projectId} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: d.projectColor }}
                      />
                      <span className="text-sm">{d.projectName}</span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={d.effort}
                      onChange={(e) => handleEffortChange(d.projectId, parseFloat(e.target.value) || 0)}
                      className="w-16 px-2 py-1 rounded border border-input bg-background text-center text-sm"
                    />
                  </div>
                ))}
                
                <div className="pt-3 border-t border-border">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">Tổng:</span>
                    <span className={cn(
                      'font-bold text-sm',
                      (editDialog?.details.reduce((sum, d) => sum + d.effort, 0) || 0) > 1 && 'text-destructive',
                      (editDialog?.details.reduce((sum, d) => sum + d.effort, 0) || 0) < 1 && (editDialog?.details.reduce((sum, d) => sum + d.effort, 0) || 0) > 0 && 'text-warning'
                    )}>
                      {editDialog?.details.reduce((sum, d) => sum + d.effort, 0).toFixed(1)}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: editDialog?.projectColor }}
                  />
                  <span className="text-sm">{editDialog?.projectName}</span>
                </div>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={editDialog?.effort || 0}
                  onChange={(e) => setEditDialog(prev => prev ? { ...prev, effort: parseFloat(e.target.value) || 0 } : null)}
                  className="w-16 px-2 py-1 rounded border border-input bg-background text-center text-sm"
                />
              </div>
            )}
            
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditDialog(null)} className="flex-1" size="sm">
                Hủy
              </Button>
              <Button onClick={handleSaveEffort} className="flex-1" size="sm" disabled={setAllocation.isPending}>
                {setAllocation.isPending && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
                Lưu
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
