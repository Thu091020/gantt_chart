import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FolderKanban, 
  Calendar,
  Settings,
  PieChart,
  LogOut,
  Briefcase,
  UserCog,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const navItems = [
  { icon: LayoutDashboard, label: 'Tổng quan', path: '/' },
  { icon: Users, label: 'Nhân sự', path: '/employees' },
  { icon: FolderKanban, label: 'Dự án', path: '/projects' },
  { icon: PieChart, label: 'Quản lý Resource', path: '/effort-summary' },
  { icon: Calendar, label: 'Ngày nghỉ lễ', path: '/holidays' },
  { icon: Settings, label: 'Cấu hình', path: '/settings' },
];

const adminNavItems = [
  { icon: UserCog, label: 'Tài khoản', path: '/users' },
];

interface SidebarProps {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed: controlledCollapsed, onCollapsedChange }: SidebarProps) {
  const location = useLocation();
  const { user, isAdmin, signOut } = useAuth();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  
  const collapsed = controlledCollapsed ?? internalCollapsed;
  const setCollapsed = onCollapsedChange ?? setInternalCollapsed;

  const NavItem = ({ item, isActive }: { item: typeof navItems[0]; isActive: boolean }) => {
    const content = (
      <Link
        to={item.path}
        className={cn(
          'sidebar-link',
          isActive && 'sidebar-link-active',
          collapsed && 'justify-center px-2'
        )}
      >
        <item.icon className="w-5 h-5 shrink-0" />
        {!collapsed && <span>{item.label}</span>}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={10}>
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar flex flex-col z-50 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className={cn("p-4 border-b border-sidebar-border", collapsed && "px-2")}>
        <div className="flex items-center justify-between">
          <div className={cn("flex items-center gap-2", collapsed && "justify-center w-full")}>
            <Briefcase className="w-7 h-7 text-sidebar-primary shrink-0" />
            {!collapsed && (
              <div>
                <h1 className="text-xl font-bold text-sidebar-foreground">VCI Resource</h1>
                <p className="text-sm text-sidebar-foreground/60">Quản lý resource</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Collapse toggle button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          "absolute -right-3 top-20 h-6 w-6 rounded-full border border-border bg-background p-0 shadow-sm hover:bg-muted",
          "flex items-center justify-center"
        )}
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </Button>
      
      <nav className={cn("flex-1 p-4 space-y-1", collapsed && "px-2")}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return <NavItem key={item.path} item={item} isActive={isActive} />;
        })}
        
        {isAdmin && (
          <>
            {!collapsed && (
              <div className="pt-3 pb-1">
                <span className="text-[10px] uppercase tracking-wider text-sidebar-foreground/40 px-4">
                  Admin
                </span>
              </div>
            )}
            {collapsed && <div className="pt-2 border-t border-sidebar-border/50 mt-2" />}
            {adminNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              return <NavItem key={item.path} item={item} isActive={isActive} />;
            })}
          </>
        )}
      </nav>
      
      <div className={cn("p-4 border-t border-sidebar-border", collapsed && "px-2")}>
        <div className={cn("flex items-center gap-3 px-4 py-2", collapsed && "justify-center px-0")}>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-semibold text-sm shrink-0 cursor-default">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right" sideOffset={10}>
                {user?.email || 'User'}
              </TooltipContent>
            )}
          </Tooltip>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-sidebar-foreground truncate">
                  {user?.email || 'User'}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={signOut}
                className="h-8 w-8 p-0 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          )}
          {collapsed && (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={signOut}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 h-8 w-8 p-0 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={10}>
                Đăng xuất
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </aside>
  );
}
