import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { Users, FolderKanban, CheckCircle, AlertTriangle, TrendingUp, UserX, ChevronLeft, ChevronRight, CalendarIcon, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, addMonths, subMonths, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, addDays, startOfWeek, min as dateMin, max as dateMax } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { useEmployees } from '@/hooks/useEmployees';
import { useProjects } from '@/hooks/useProjects';
import { useAllocations } from '@/hooks/useAllocations';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, Line, ComposedChart, PieChart, Pie, Cell, ReferenceLine } from 'recharts';
import { AlertsList } from '@/components/dashboard/AlertsList';
import { DateRangePicker } from '@/components/common/DateRangePicker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// X-axis grouping mode (how to divide the chart)
type XAxisMode = 'week' | 'month' | 'quarter';

export default function Dashboard() {
  const { data: employees = [] } = useEmployees();
  const { data: projects = [] } = useProjects();

  const today = new Date();
  
  // Chart controls - X-axis grouping mode (separate from date range)
  const [xAxisMode, setXAxisMode] = useState<XAxisMode>('week');
  
  // Date range - default 6 months from current month
  const [chartStartDate, setChartStartDate] = useState(() => startOfMonth(today));
  const [chartEndDate, setChartEndDate] = useState(() => endOfMonth(addMonths(today, 5)));

  // Handle custom date range change
  const handleChartDateRangeChange = (start: Date, end: Date) => {
    setChartStartDate(start);
    setChartEndDate(end);
  };
  
  // Metrics month picker
  const [metricsMonth, setMetricsMonth] = useState(() => startOfMonth(today));
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  
  // Status distribution popup state
  const [selectedStatus, setSelectedStatus] = useState<{
    name: string;
    color: string;
    description: string;
    employeesWithEffort: { name: string; effort: number; percent: number }[];
    totalInCategory: number;
  } | null>(null);

  const handlePrevMonth = () => setMetricsMonth(prev => subMonths(prev, 1));
  const handleNextMonth = () => setMetricsMonth(prev => addMonths(prev, 1));
  const handleSelectMonth = (monthDate: Date) => {
    setMetricsMonth(startOfMonth(monthDate));
    setMonthPickerOpen(false);
  };
  
  // Calculate the union date range for fetching allocations
  // This covers both metrics month and chart date range
  const allocationDateRange = useMemo(() => {
    const metricsStart = startOfMonth(metricsMonth);
    const metricsEnd = endOfMonth(metricsMonth);
    
    return {
      startDate: format(dateMin([metricsStart, chartStartDate]), 'yyyy-MM-dd'),
      endDate: format(dateMax([metricsEnd, chartEndDate]), 'yyyy-MM-dd'),
    };
  }, [metricsMonth, chartStartDate, chartEndDate]);
  
  // Fetch allocations with the union date range
  const { data: allocations = [] } = useAllocations(allocationDateRange);
  
  const activeEmployees = useMemo(() => employees.filter(e => e.is_active), [employees]);
  
  // For metrics - use selected month
  const metricsDaysInRange = useMemo(() => 
    eachDayOfInterval({ start: startOfMonth(metricsMonth), end: endOfMonth(metricsMonth) }), 
    [metricsMonth]
  );
  const metricsWorkingDays = metricsDaysInRange.filter(d => d.getDay() !== 0 && d.getDay() !== 6).length || 1;

  // Generate months for picker (current year + prev/next year)
  const availableMonths = useMemo(() => {
    const months: Date[] = [];
    for (let i = -12; i <= 12; i++) {
      months.push(addMonths(startOfMonth(today), i));
    }
    return months;
  }, []);

  // For chart
  const chartDaysInRange = useMemo(() => 
    eachDayOfInterval({ start: chartStartDate, end: chartEndDate }), 
    [chartStartDate, chartEndDate]
  );

  // Stats calculation (for selected metrics month)
  const stats = useMemo(() => {
    // Calculate employee status based on their actual total effort over working days
    const workingDays = metricsDaysInRange.filter(d => d.getDay() !== 0 && d.getDay() !== 6);
    const totalWorkingDays = workingDays.length;
    
    const employeeStats = activeEmployees.map(employee => {
      let totalEffortInMonth = 0;
      let daysOverloaded = 0; // > 100%
      
      workingDays.forEach(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const dayAllocations = allocations.filter(
          a => a.employee_id === employee.id && a.date === dateStr
        );
        const dayEffort = dayAllocations.reduce((sum, a) => sum + Number(a.effort), 0);
        totalEffortInMonth += dayEffort;
        
        if (dayEffort > 1) daysOverloaded++;
      });
      
      // Calculate utilization as percentage (total effort / total capacity)
      // If employee has 100% effort every working day, utilizationRatio = 1.0
      const utilizationRatio = totalWorkingDays > 0 
        ? totalEffortInMonth / totalWorkingDays
        : 0;
      
      // Round to 2 decimal places to avoid floating point issues
      const roundedRatio = Math.round(utilizationRatio * 100) / 100;
      
      return {
        employee,
        totalEffortInMonth: Math.round(totalEffortInMonth * 100) / 100,
        daysOverloaded,
        totalWorkingDays,
        utilizationRatio: roundedRatio,
        utilizationPercent: Math.round(roundedRatio * 100) // for display
      };
    });

    // Categorize employees based on their utilization
    // "Nhàn rỗi" = < 50% utilization
    // "Đang phân bổ" = 50-99% utilization  
    // "Đủ việc" = exactly 100% utilization
    // "Full" = > 100% utilization (overloaded)
    const idleCount = employeeStats.filter(e => e.utilizationRatio < 0.5).length;
    const allocatedCount = employeeStats.filter(e => e.utilizationRatio >= 0.5 && e.utilizationRatio < 1).length;
    const adequateCount = employeeStats.filter(e => e.utilizationRatio >= 1 && e.utilizationRatio <= 1).length;
    const fullCount = employeeStats.filter(e => e.utilizationRatio > 1).length;
    const activeProjects = projects.filter(p => p.status === 'active').length;

    // Count overloaded person-days
    let warningCount = 0;
    employeeStats.forEach(e => {
      warningCount += e.daysOverloaded;
    });

    // Capacity utilization - total effort vs total capacity
    const totalCapacity = activeEmployees.length * metricsWorkingDays;
    const totalEffort = employeeStats.reduce((sum, e) => sum + e.totalEffortInMonth, 0);
    const capacityUtilization = totalCapacity > 0 ? Math.round((totalEffort / totalCapacity) * 100) : 0;

    return { 
      totalEmployees: activeEmployees.length, 
      idleCount, 
      allocatedCount, 
      adequateCount, 
      fullCount, 
      activeProjects, 
      warningCount,
      capacityUtilization,
      totalEffort: Math.round(totalEffort * 10) / 10,
      totalCapacity,
      employeeStats // expose for detailed tooltip
    };
  }, [activeEmployees, projects, allocations, metricsDaysInRange, metricsWorkingDays]);

  // Capacity vs Effort line chart data (uses chart date range with xAxisMode for grouping)
  const capacityVsEffortData = useMemo(() => {
    const getPeriodsInRange = () => {
      switch (xAxisMode) {
        case 'week':
          return eachWeekOfInterval({ start: chartStartDate, end: chartEndDate }, { weekStartsOn: 1 });
        case 'month':
          return eachMonthOfInterval({ start: chartStartDate, end: chartEndDate });
        case 'quarter':
          // Group by quarters
          const quarters: Date[] = [];
          let current = startOfMonth(chartStartDate);
          while (current <= chartEndDate) {
            const quarterMonth = Math.floor(current.getMonth() / 3) * 3;
            const quarterStart = new Date(current.getFullYear(), quarterMonth, 1);
            if (quarters.length === 0 || quarters[quarters.length - 1].getTime() !== quarterStart.getTime()) {
              quarters.push(quarterStart);
            }
            current = addMonths(current, 1);
          }
          return quarters;
      }
    };

    const periods = getPeriodsInRange();
    
    return periods.map((periodStart, index) => {
      let periodDays: Date[];
      let label: string;
      
      switch (xAxisMode) {
        case 'week':
          const weekEnd = addDays(periodStart, 6);
          const actualWeekEnd = weekEnd > chartEndDate ? chartEndDate : weekEnd;
          const actualWeekStart = periodStart < chartStartDate ? chartStartDate : periodStart;
          periodDays = eachDayOfInterval({ 
            start: actualWeekStart, 
            end: actualWeekEnd 
          }).filter(d => d.getDay() !== 0 && d.getDay() !== 6);
          label = `${format(periodStart, 'dd/MM')}`;
          break;
        case 'month':
          const monthEnd = endOfMonth(periodStart);
          const actualMonthEnd = monthEnd > chartEndDate ? chartEndDate : monthEnd;
          const actualMonthStart = periodStart < chartStartDate ? chartStartDate : periodStart;
          periodDays = eachDayOfInterval({ 
            start: actualMonthStart, 
            end: actualMonthEnd 
          }).filter(d => d.getDay() !== 0 && d.getDay() !== 6);
          label = format(periodStart, 'MMM yy', { locale: vi });
          break;
        case 'quarter':
          const quarterEnd = endOfMonth(addMonths(periodStart, 2));
          const actualQuarterEnd = quarterEnd > chartEndDate ? chartEndDate : quarterEnd;
          const actualQuarterStart = periodStart < chartStartDate ? chartStartDate : periodStart;
          periodDays = eachDayOfInterval({ 
            start: actualQuarterStart, 
            end: actualQuarterEnd 
          }).filter(d => d.getDay() !== 0 && d.getDay() !== 6);
          const quarterNum = Math.floor(periodStart.getMonth() / 3) + 1;
          label = `Q${quarterNum}/${periodStart.getFullYear()}`;
          break;
      }

      const workingDaysInPeriod = periodDays.length;
      const capacity = activeEmployees.length * workingDaysInPeriod;
      
      const effort = periodDays.reduce((total, day) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const dayAllocations = allocations.filter(a => a.date === dateStr);
        return total + dayAllocations.reduce((sum, a) => sum + Number(a.effort), 0);
      }, 0);

      return {
        name: label,
        capacity: Math.round(capacity * 10) / 10,
        effort: Math.round(effort * 10) / 10,
        periodStart: periodStart
      };
    });
  }, [xAxisMode, chartStartDate, chartEndDate, activeEmployees, allocations]);

  // Find current period label for reference line
  const currentPeriodLabel = useMemo(() => {
    const now = new Date();
    switch (xAxisMode) {
      case 'week':
        const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
        return `${format(currentWeekStart, 'dd/MM')}`;
      case 'month':
        return format(now, 'MMM yy', { locale: vi });
      case 'quarter':
        const quarterNum = Math.floor(now.getMonth() / 3) + 1;
        return `Q${quarterNum}/${now.getFullYear()}`;
    }
  }, [xAxisMode]);

  // Status distribution for pie chart with detailed descriptions
  const statusDistribution = useMemo(() => {
    const getEmployeesWithEffort = (filterFn: (e: typeof stats.employeeStats[0]) => boolean) => {
      return stats.employeeStats
        .filter(filterFn)
        .map(e => ({
          name: e.employee.name,
          effort: e.totalEffortInMonth,
          percent: e.utilizationPercent
        }))
        .sort((a, b) => b.percent - a.percent); // Sort by utilization descending
    };

    const idleEmployees = getEmployeesWithEffort(e => e.utilizationRatio < 0.5);
    const allocatedEmployees = getEmployeesWithEffort(e => e.utilizationRatio >= 0.5 && e.utilizationRatio < 1);
    const adequateEmployees = getEmployeesWithEffort(e => e.utilizationRatio >= 1 && e.utilizationRatio <= 1);
    const fullEmployees = getEmployeesWithEffort(e => e.utilizationRatio > 1);

    return [
      { 
        name: 'Nhàn rỗi', 
        value: stats.idleCount, 
        color: '#10B981',
        description: 'Sử dụng < 50% thời gian trong tháng',
        employeesWithEffort: idleEmployees,
        totalInCategory: stats.idleCount
      },
      { 
        name: 'Đang phân bổ', 
        value: stats.allocatedCount, 
        color: '#F59E0B',
        description: 'Sử dụng 50-99% thời gian trong tháng',
        employeesWithEffort: allocatedEmployees,
        totalInCategory: stats.allocatedCount
      },
      { 
        name: 'Đủ việc', 
        value: stats.adequateCount, 
        color: '#3B82F6',
        description: 'Sử dụng đúng 100% thời gian trong tháng',
        employeesWithEffort: adequateEmployees,
        totalInCategory: stats.adequateCount
      },
      { 
        name: 'Full', 
        value: stats.fullCount, 
        color: '#EF4444',
        description: 'Sử dụng > 100% thời gian trong tháng (quá tải)',
        employeesWithEffort: fullEmployees,
        totalInCategory: stats.fullCount
      }
    ].filter(d => d.value > 0);
  }, [stats]);

  // Unassigned employees (current month)
  const unassignedEmployees = useMemo(() => {
    return activeEmployees.filter(employee => {
      const hasAllocation = metricsDaysInRange.some(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        return allocations.some(a => a.employee_id === employee.id && a.date === dateStr);
      });
      return !hasAllocation;
    });
  }, [activeEmployees, allocations, metricsDaysInRange]);

  return (
    <MainLayout>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-xl font-bold">Tổng quan nguồn lực</h1>
          
          {/* Month Picker */}
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0"
              onClick={handlePrevMonth}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <Popover open={monthPickerOpen} onOpenChange={setMonthPickerOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 min-w-[120px]">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  {format(metricsMonth, 'MMMM yyyy', { locale: vi })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3" align="end">
                <div className="grid grid-cols-3 gap-1.5 max-h-[240px] overflow-y-auto scrollbar-thin">
                  {availableMonths.map((month) => (
                    <Button
                      key={month.toISOString()}
                      variant={month.getTime() === metricsMonth.getTime() ? 'default' : 'ghost'}
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => handleSelectMonth(month)}
                    >
                      {format(month, 'MMM yy', { locale: vi })}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0"
              onClick={handleNextMonth}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          <MetricCard
            title="Nhân viên"
            value={stats.totalEmployees}
            subtitle="đang active"
            icon={<Users className="w-4 h-4" />}
          />
          <MetricCard
            title="Dự án"
            value={stats.activeProjects}
            subtitle="đang hoạt động"
            icon={<FolderKanban className="w-4 h-4" />}
          />
          <MetricCard
            title="Capacity"
            value={`${stats.capacityUtilization}%`}
            subtitle={`${stats.totalEffort}/${stats.totalCapacity} man-days`}
            icon={<TrendingUp className="w-4 h-4" />}
          />
          <MetricCard
            title="Nhàn rỗi"
            value={stats.idleCount}
            subtitle="< 50% effort"
            icon={<CheckCircle className="w-4 h-4" />}
          />
          <MetricCard
            title="Quá tải"
            value={stats.warningCount}
            subtitle="ngày/người > 100%"
            icon={<AlertTriangle className="w-4 h-4" />}
          />
          <MetricCard
            title="Chưa assign"
            value={unassignedEmployees.length}
            subtitle={format(metricsMonth, 'MMM yyyy', { locale: vi })}
            icon={<UserX className="w-4 h-4" />}
          />
        </div>

        {/* Capacity vs Effort Chart with separate controls */}
        <div className="bg-card rounded-lg border border-border p-3">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="text-sm font-semibold">Capacity vs Effort theo thời gian</h2>
            <div className="flex items-center gap-3">
              {/* Date range picker */}
              <DateRangePicker
                startDate={chartStartDate}
                endDate={chartEndDate}
                onRangeChange={handleChartDateRangeChange}
              />
              {/* X-axis grouping mode */}
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground mr-1">Chia theo:</span>
                <div className="flex items-center gap-0.5 bg-muted rounded-md p-0.5">
                  <Button 
                    variant={xAxisMode === 'week' ? 'default' : 'ghost'} 
                    size="sm" 
                    className="h-6 text-[11px] px-2"
                    onClick={() => setXAxisMode('week')}
                  >
                    Tuần
                  </Button>
                  <Button 
                    variant={xAxisMode === 'month' ? 'default' : 'ghost'} 
                    size="sm" 
                    className="h-6 text-[11px] px-2"
                    onClick={() => setXAxisMode('month')}
                  >
                    Tháng
                  </Button>
                  <Button 
                    variant={xAxisMode === 'quarter' ? 'default' : 'ghost'} 
                    size="sm" 
                    className="h-6 text-[11px] px-2"
                    onClick={() => setXAxisMode('quarter')}
                  >
                    Quý
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {capacityVsEffortData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={capacityVsEffortData} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="effortGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={11} 
                  width={40}
                  tickLine={false}
                  label={{ value: 'Man-days', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' } }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))', 
                    borderRadius: '6px', 
                    fontSize: '11px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value: number, name: string) => [
                    `${value} man-days`,
                    name === 'capacity' ? 'Capacity tiêu chuẩn' : 'Effort thực tế'
                  ]}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                  formatter={(value) => value === 'capacity' ? 'Capacity tiêu chuẩn' : 'Effort thực tế'}
                />
                <Area 
                  type="monotone" 
                  dataKey="effort" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  fill="url(#effortGradient)"
                />
                <Line 
                  type="monotone" 
                  dataKey="capacity" 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
                {/* Current time reference line */}
                <ReferenceLine 
                  x={currentPeriodLabel} 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  strokeDasharray="3 3"
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
              Chưa có dữ liệu
            </div>
          )}
        </div>

        {/* Bottom Row: Status Distribution + Alerts + Unassigned */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
          {/* Employee Status Pie */}
          <div className="bg-card rounded-lg border border-border p-3 flex flex-col max-h-[350px]">
            <div className="mb-2">
              <h2 className="text-sm font-semibold">
                Phân bổ trạng thái tháng {format(metricsMonth, 'MM/yyyy')}
              </h2>
              <p className="text-[10px] text-muted-foreground">
                Tổng công tháng tiêu chuẩn: {stats.totalCapacity / stats.totalEmployees || 0} days
              </p>
            </div>
            <div className="flex-1 min-h-0 flex flex-col">
              {statusDistribution.length > 0 ? (
                <>
                  <div className="flex-1 min-h-[140px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={65}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                          labelLine={false}
                          onClick={(data) => setSelectedStatus(data)}
                          style={{ cursor: 'pointer' }}
                        >
                          {statusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legend with explanations */}
                  <div className="mt-2 space-y-1 text-[10px] border-t border-border pt-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-[#10B981]" />
                      <span className="text-muted-foreground">Nhàn rỗi: sử dụng &lt; 50%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                      <span className="text-muted-foreground">Đang phân bổ: sử dụng 50-99%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                      <span className="text-muted-foreground">Đủ việc: sử dụng 100%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-[#EF4444]" />
                      <span className="text-muted-foreground">Full: sử dụng &gt; 100%</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  Chưa có nhân viên
                </div>
              )}
            </div>
          </div>

          {/* Alerts */}
          <AlertsList 
            employees={activeEmployees}
            projects={projects}
            allocations={allocations}
            daysInRange={metricsDaysInRange}
            className="flex flex-col max-h-[350px]"
          />

          {/* Unassigned Employees */}
          <div className="bg-card rounded-lg border border-border p-3 flex flex-col max-h-[350px]">
            <h2 className="text-sm font-semibold mb-2">Nhân viên chưa assign</h2>
            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
              {unassignedEmployees.length > 0 ? (
                <div className="space-y-1.5">
                  {unassignedEmployees.map(emp => (
                    <div key={emp.id} className="flex items-center justify-between py-1 px-2 bg-muted/50 rounded text-xs">
                      <div>
                        <span className="font-medium">{emp.name}</span>
                        {emp.position && (
                          <span className="text-muted-foreground ml-1">• {emp.position}</span>
                        )}
                      </div>
                      <span className="text-muted-foreground">{emp.department || '-'}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[140px] flex items-center justify-center text-muted-foreground text-sm">
                  Tất cả đã được assign
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Distribution Dialog */}
      <Dialog open={!!selectedStatus} onOpenChange={() => setSelectedStatus(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: selectedStatus?.color }} 
              />
              {selectedStatus?.name}: {selectedStatus?.totalInCategory} người
            </DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground mb-3">
            {selectedStatus?.description}
          </div>
          <div className="max-h-[300px] overflow-y-auto scrollbar-thin">
            <div className="space-y-1">
              {selectedStatus?.employeesWithEffort.map((emp, i) => (
                <div 
                  key={i} 
                  className="flex items-center justify-between py-1.5 px-2 bg-muted/50 rounded text-sm"
                >
                  <span className="font-medium truncate flex-1">{emp.name}</span>
                  <span className="text-muted-foreground whitespace-nowrap ml-2">
                    {emp.effort} days ({emp.percent}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
