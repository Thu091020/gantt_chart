import { useEffect, useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Download, Upload, CalendarIcon, Loader2, Users, MousePointer2 } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { useProjects } from '@/hooks/useProjects';
import { useAllocations } from '@/hooks/useAllocations';
import { useHolidays } from '@/hooks/useHolidays';
import { useSettings, useUpdateSetting, SaturdaySchedule } from '@/hooks/useSettings';
import { useSystemStats } from '@/hooks/useSystemStats';
import { format, addWeeks, isSaturday, addDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';

export default function Settings() {
  const { data: employees = [] } = useEmployees();
  const { data: projects = [] } = useProjects();
  const { data: allocations = [] } = useAllocations();
  const { data: holidays = [] } = useHolidays();
  const { data: settings } = useSettings();
  const { data: stats } = useSystemStats();
  const updateSetting = useUpdateSetting();
  const [isExporting, setIsExporting] = useState(false);

  // Local UI state so RadioGroup reflects immediately (before query refetch)
  const [localSaturdaySchedule, setLocalSaturdaySchedule] = useState<SaturdaySchedule | null>(null);

  useEffect(() => {
    if (settings?.saturday_schedule) {
      setLocalSaturdaySchedule(settings.saturday_schedule);
    } else if (settings) {
      // Settings loaded but schedule missing → use safe defaults
      setLocalSaturdaySchedule({
        enabled: false,
        alternating: false,
        startWeekWithSaturday: true,
        referenceStartDate: undefined,
      });
    }
  }, [settings]);

  // Get next few Saturdays for quick selection
  const getUpcomingSaturdays = () => {
    const saturdays = [];
    let currentDate = new Date();
    
    // Find next Saturday
    while (!isSaturday(currentDate)) {
      currentDate = addDays(currentDate, 1);
    }
    
    // Get 4 upcoming Saturdays
    for (let i = 0; i < 4; i++) {
      saturdays.push(addWeeks(currentDate, i));
    }
    return saturdays;
  };

  const upcomingSaturdays = getUpcomingSaturdays();

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      // Fetch all data from database
      const [
        { data: tasksData },
        { data: taskStatusesData },
        { data: settingsData }
      ] = await Promise.all([
        supabase.from('tasks').select('*'),
        supabase.from('task_statuses').select('*'),
        supabase.from('settings').select('*')
      ]);

      const exportData = {
        version: '2.0',
        exportedAt: new Date().toISOString(),
        data: {
          employees,
          projects,
          allocations,
          holidays,
          tasks: tasksData || [],
          taskStatuses: taskStatusesData || [],
          settings: settingsData || []
        }
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resource-planner-backup-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Đã xuất dữ liệu thành công');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Lỗi khi xuất dữ liệu');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonData = JSON.parse(event.target?.result as string);
        
        // Validate data structure
        if (!jsonData.data && !jsonData.employees) {
          toast.error('File không đúng định dạng');
          return;
        }

        // Support both old format (v1) and new format (v2)
        const data = jsonData.data || jsonData;
        
        toast.info(`Đã đọc file backup từ ${jsonData.exportedAt || 'unknown'}. Tính năng import đang được phát triển.`);
      } catch (error) {
        console.error('Import error:', error);
        toast.error('Lỗi khi đọc file JSON');
      }
    };
    reader.readAsText(file);
    
    // Reset input
    e.target.value = '';
  };

  const handleSaturdayModeChange = (mode: 'off' | 'all' | 'alternating') => {
    const defaultRef = upcomingSaturdays[0] ? format(upcomingSaturdays[0], 'yyyy-MM-dd') : undefined;

    const nextSchedule: SaturdaySchedule = {
      enabled: mode !== 'off',
      alternating: mode === 'alternating',
      startWeekWithSaturday: localSaturdaySchedule?.startWeekWithSaturday ?? true,
      // If user switches to alternating and hasn't picked a reference date yet,
      // auto-pick the next Saturday so UI immediately shows selection.
      referenceStartDate:
        mode === 'alternating'
          ? (localSaturdaySchedule?.referenceStartDate ?? defaultRef)
          : (localSaturdaySchedule?.referenceStartDate ?? undefined),
    };

    setLocalSaturdaySchedule(nextSchedule);
    updateSetting.mutate({ key: 'saturday_schedule', value: nextSchedule });
  };

  const handleSelectSaturday = (date: Date) => {
    const nextSchedule: SaturdaySchedule = {
      enabled: true,
      alternating: true,
      startWeekWithSaturday: localSaturdaySchedule?.startWeekWithSaturday ?? true,
      referenceStartDate: format(date, 'yyyy-MM-dd'),
    };

    setLocalSaturdaySchedule(nextSchedule);
    updateSetting.mutate({ key: 'saturday_schedule', value: nextSchedule });
  };

  const currentMode: 'off' | 'all' | 'alternating' =
    !localSaturdaySchedule?.enabled ? 'off' :
    localSaturdaySchedule?.alternating ? 'alternating' : 'all';

  return (
    <MainLayout>
      <div className="space-y-4">
        <h1 className="text-xl font-bold">Cấu hình hệ thống</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Saturday Schedule */}
          <div className="bg-card rounded-lg border border-border p-4 space-y-4">
            <h2 className="text-sm font-semibold">Lịch làm việc thứ 7</h2>
            
            <RadioGroup 
              value={currentMode} 
              onValueChange={(value) => handleSaturdayModeChange(value as 'off' | 'all' | 'alternating')}
              className="space-y-2"
            >
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                <RadioGroupItem value="off" id="sat-off" />
                <Label htmlFor="sat-off" className="flex-1 cursor-pointer">
                  <p className="text-sm font-medium">Nghỉ thứ 7</p>
                  <p className="text-xs text-muted-foreground">Không làm việc vào thứ 7</p>
                </Label>
              </div>
              
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                <RadioGroupItem value="all" id="sat-all" />
                <Label htmlFor="sat-all" className="flex-1 cursor-pointer">
                  <p className="text-sm font-medium">Làm thứ 7 hàng tuần</p>
                  <p className="text-xs text-muted-foreground">Làm việc tất cả các thứ 7</p>
                </Label>
              </div>
              
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                <RadioGroupItem value="alternating" id="sat-alt" />
                <Label htmlFor="sat-alt" className="flex-1 cursor-pointer">
                  <p className="text-sm font-medium">Làm thứ 7 cách tuần</p>
                  <p className="text-xs text-muted-foreground">Tuần làm, tuần nghỉ xen kẽ</p>
                </Label>
              </div>
            </RadioGroup>

            {currentMode === 'alternating' && (
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 space-y-3">
                <p className="text-xs font-medium">Chọn ngày thứ 7 bắt đầu làm việc:</p>
                
                {/* Quick select buttons */}
                <div className="grid grid-cols-2 gap-2">
                  {upcomingSaturdays.map((sat, index) => (
                    <Button
                      key={index}
                      variant={localSaturdaySchedule?.referenceStartDate === format(sat, 'yyyy-MM-dd') ? "default" : "outline"}
                      size="sm"
                      className="h-9 text-xs justify-start"
                      onClick={() => handleSelectSaturday(sat)}
                    >
                      <CalendarIcon className="w-3.5 h-3.5 mr-2" />
                      {format(sat, 'dd/MM/yyyy', { locale: vi })}
                    </Button>
                  ))}
                </div>

                {/* Or pick from calendar */}
                <div className="pt-2 border-t border-border/50">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs w-full justify-center text-muted-foreground"
                      >
                        <CalendarIcon className="w-3.5 h-3.5 mr-2" />
                        Hoặc chọn ngày khác từ lịch...
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 pointer-events-auto" align="center">
                      <Calendar
                        mode="single"
                        selected={localSaturdaySchedule?.referenceStartDate
                          ? new Date(localSaturdaySchedule.referenceStartDate)
                          : undefined}
                        onSelect={(date) => {
                          if (date && isSaturday(date)) {
                            handleSelectSaturday(date);
                          } else if (date) {
                            toast.error('Vui lòng chọn ngày thứ 7');
                          }
                        }}
                        disabled={(date) => !isSaturday(date)}
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {localSaturdaySchedule?.referenceStartDate && (
                  <div className="text-xs text-center p-2 bg-primary/10 rounded">
                    Bắt đầu làm từ: <span className="font-semibold">
                      {format(new Date(localSaturdaySchedule.referenceStartDate), 'EEEE, dd/MM/yyyy', { locale: vi })}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Data Management */}
          <div className="bg-card rounded-lg border border-border p-4 space-y-3">
            <h2 className="text-sm font-semibold">Quản lý dữ liệu</h2>
            
            <div className="flex items-center justify-between py-2 px-3 bg-secondary/50 rounded">
              <div>
                <p className="text-sm font-medium">Xuất dữ liệu backup</p>
                <p className="text-xs text-muted-foreground">
                  Bao gồm: Nhân viên, Dự án, Tasks, Phân bổ, Ngày lễ, Cài đặt
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7" 
                onClick={handleExportData}
                disabled={isExporting}
              >
                {isExporting ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                )}
                Xuất JSON
              </Button>
            </div>

            <div className="flex items-center justify-between py-2 px-3 bg-secondary/50 rounded">
              <div>
                <p className="text-sm font-medium">Nhập dữ liệu</p>
                <p className="text-xs text-muted-foreground">Khôi phục từ file backup JSON</p>
              </div>
              <div>
                <input type="file" accept=".json" onChange={handleImportData} className="hidden" id="import-file" />
                <Button variant="outline" size="sm" className="h-7" asChild>
                  <label htmlFor="import-file" className="cursor-pointer">
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    Nhập
                  </label>
                </Button>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-card rounded-lg border border-border p-4 lg:col-span-2">
            <h2 className="text-sm font-semibold mb-3">Thống kê hệ thống</h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-secondary/50 rounded text-center">
                <p className="text-xl font-bold">{stats?.employees ?? '-'}</p>
                <p className="text-xs text-muted-foreground">Nhân viên</p>
              </div>
              <div className="p-3 bg-secondary/50 rounded text-center">
                <p className="text-xl font-bold">{stats?.projects ?? '-'}</p>
                <p className="text-xs text-muted-foreground">Dự án</p>
              </div>
              <div className="p-3 bg-secondary/50 rounded text-center">
                <p className="text-xl font-bold">{stats?.allocations ?? '-'}</p>
                <p className="text-xs text-muted-foreground">Phân bổ</p>
              </div>
              <div className="p-3 bg-secondary/50 rounded text-center">
                <p className="text-xl font-bold">{stats?.holidays ?? '-'}</p>
                <p className="text-xs text-muted-foreground">Ngày nghỉ lễ</p>
              </div>
            </div>
          </div>

          {/* Collaboration Settings - Compact */}
          <div className="bg-card rounded-lg border border-border p-3 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MousePointer2 className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold flex items-center gap-2">
                    Cộng tác thời gian thực
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Xem người dùng online và con trỏ chuột trong Gantt/Nguồn lực
                  </p>
                </div>
              </div>
              <Switch
                checked={settings?.collaboration_enabled !== false}
                onCheckedChange={(checked) => {
                  updateSetting.mutate({ key: 'collaboration_enabled', value: checked });
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
