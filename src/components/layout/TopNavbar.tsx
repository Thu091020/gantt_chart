import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FolderKanban, 
  Calendar,
  Settings,
  PieChart,
  LogOut,
  UserCog,
  Clock,
  Sun,
  Moon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/components/ThemeProvider';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useEffect, useState } from 'react';

const mainNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: FolderKanban, label: 'Dự án', path: '/projects' },
  { icon: PieChart, label: 'Nguồn lực', path: '/effort-summary' },
  { icon: Users, label: 'Nhân sự', path: '/employees' },
];

const rightNavItems = [
  { icon: Calendar, label: 'Ngày nghỉ', path: '/holidays' },
  { icon: Settings, label: 'Cấu hình', path: '/settings' },
];

const adminNavItems = [
  { icon: UserCog, label: 'Tài khoản', path: '/users' },
];

export function TopNavbar() {
  const location = useLocation();
  const { user, isAdmin, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN', { 
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    });
  };

  const NavItem = ({ item, isActive }: { 
    item: typeof mainNavItems[0]; 
    isActive: boolean;
  }) => (
    <Link
      to={item.path}
      className={cn(
        'relative px-4 py-2 text-sm font-medium transition-colors duration-200',
        theme === 'dark' 
          ? 'hover:text-cyan-300' 
          : 'hover:text-blue-600',
        theme === 'dark'
          ? (isActive ? 'text-cyan-400' : 'text-slate-300')
          : (isActive ? 'text-blue-600' : 'text-slate-600')
      )}
    >
      <span className="flex items-center gap-2">
        <item.icon className="w-4 h-4" />
        {item.label}
      </span>
      {isActive && (
        <span className={cn(
          "absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full",
          theme === 'dark' ? 'bg-cyan-400' : 'bg-blue-600'
        )} />
      )}
    </Link>
  );

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 h-10 border-b shadow-lg",
      theme === 'dark' 
        ? 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-cyan-500/30 shadow-slate-900/50'
        : 'bg-white border-slate-200 shadow-slate-200/50'
    )}>
      {/* Decorative top line */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent to-transparent",
        theme === 'dark' ? 'via-cyan-400' : 'via-blue-400'
      )} />
      
      <div className="h-full flex items-center px-4">
        {/* Left navigation */}
        <nav className="flex-1 flex items-center gap-1">
          {mainNavItems.map((item) => {
            const isActive = item.path === '/' 
              ? location.pathname === '/' 
              : location.pathname.startsWith(item.path);
            return <NavItem key={item.path} item={item} isActive={isActive} />;
          })}
        </nav>

        {/* Center - Title */}
        <div className="flex-shrink-0 px-6">
          <h1 
            className={cn(
              "text-sm font-black tracking-tight uppercase",
              theme === 'dark'
                ? "text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                : "text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600"
            )} 
            style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '0.05em' }}
          >
            VCI RESOURCE
          </h1>
        </div>

        {/* Right navigation */}
        <nav className="flex-1 flex items-center justify-end gap-1">
          {rightNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return <NavItem key={item.path} item={item} isActive={isActive} />;
          })}

          {isAdmin && adminNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return <NavItem key={item.path} item={item} isActive={isActive} />;
          })}

          {/* Time display */}
          <div className={cn(
            "ml-3 px-3 py-1 text-xs font-mono border-l",
            theme === 'dark' 
              ? 'text-cyan-300/80 border-cyan-500/30'
              : 'text-slate-600 border-slate-200'
          )}>
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              <div className="flex flex-col items-end">
                <span>{formatTime(currentTime)}</span>
                <span className={cn(
                  "text-[10px]",
                  theme === 'dark' ? 'text-cyan-400/60' : 'text-slate-400'
                )}>{formatDate(currentTime)}</span>
              </div>
            </div>
          </div>

          {/* Theme toggle */}
          <div className={cn(
            "ml-3 pl-3 border-l flex items-center gap-2",
            theme === 'dark' ? 'border-cyan-500/30' : 'border-slate-200'
          )}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5">
                  <Sun className={cn("w-3 h-3", theme === 'dark' ? 'text-yellow-400' : 'text-amber-500')} />
                  <Switch
                    checked={theme === 'dark'}
                    onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                    className={cn(
                      "h-4 w-7",
                      theme === 'dark' 
                        ? 'data-[state=checked]:bg-cyan-600 data-[state=unchecked]:bg-slate-400'
                        : 'data-[state=checked]:bg-slate-600 data-[state=unchecked]:bg-blue-500'
                    )}
                  />
                  <Moon className={cn("w-3 h-3", theme === 'dark' ? 'text-cyan-400' : 'text-slate-400')} />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </TooltipContent>
            </Tooltip>
          </div>

          {/* User section */}
          <div className={cn(
            "ml-3 pl-3 border-l flex items-center gap-2",
            theme === 'dark' ? 'border-cyan-500/30' : 'border-slate-200'
          )}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-white font-semibold text-xs cursor-default shadow-md",
                  theme === 'dark' 
                    ? 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-cyan-500/30'
                    : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-blue-500/30'
                )}>
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {user?.email || 'User'}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={signOut}
                  className={cn(
                    "h-6 w-6 p-0",
                    theme === 'dark' 
                      ? 'text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10'
                      : 'text-slate-500 hover:text-blue-600 hover:bg-blue-500/10'
                  )}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                Đăng xuất
              </TooltipContent>
            </Tooltip>
          </div>
        </nav>
      </div>

      {/* Decorative corner accents */}
      <div className={cn(
        "absolute top-2 left-2 w-2 h-2 border-l-2 border-t-2",
        theme === 'dark' ? 'border-cyan-500/50' : 'border-blue-400/50'
      )} />
      <div className={cn(
        "absolute top-2 right-2 w-2 h-2 border-r-2 border-t-2",
        theme === 'dark' ? 'border-cyan-500/50' : 'border-blue-400/50'
      )} />
    </header>
  );
}
