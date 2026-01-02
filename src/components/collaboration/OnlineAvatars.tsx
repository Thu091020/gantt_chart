import { UserPresence } from '@/hooks/usePresence';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Users } from 'lucide-react';

interface OnlineAvatarsProps {
  users: UserPresence[];
  currentUser?: UserPresence | null;
  maxDisplay?: number;
}

export function OnlineAvatars({ users, currentUser, maxDisplay = 3 }: OnlineAvatarsProps) {
  const allUsers = currentUser ? [currentUser, ...users] : users;
  const displayUsers = allUsers.slice(0, maxDisplay);
  const remainingCount = allUsers.length - maxDisplay;

  if (allUsers.length === 0) return null;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-0.5">
        <div className="flex -space-x-1.5">
          {displayUsers.map((user, index) => (
            <Tooltip key={user.id}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-medium border border-background cursor-default transition-transform hover:scale-110 hover:z-10',
                    index === 0 && currentUser && 'ring-1 ring-primary ring-offset-1 ring-offset-background'
                  )}
                  style={{ backgroundColor: user.color, zIndex: displayUsers.length - index }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                <p className="font-medium">{user.name}</p>
                <p className="text-muted-foreground">{user.email}</p>
                {index === 0 && currentUser && (
                  <p className="text-primary font-medium mt-1">Bạn</p>
                )}
              </TooltipContent>
            </Tooltip>
          ))}
          
          {remainingCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center bg-muted text-muted-foreground text-[10px] font-medium border border-background"
                  style={{ zIndex: 0 }}
                >
                  +{remainingCount}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                <p>{remainingCount} người khác đang xem</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
