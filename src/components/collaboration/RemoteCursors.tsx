import { useEffect, useState, useMemo } from 'react';
import { UserPresence, CursorPosition } from '@/hooks/usePresence';
import { cn } from '@/lib/utils';

interface RemoteCursorsProps {
  cursors: Map<string, CursorPosition>;
  users: UserPresence[];
  containerRef?: React.RefObject<HTMLElement>;
}

interface CursorData {
  user: UserPresence;
  position: CursorPosition;
  isActive: boolean;
}

export function RemoteCursors({ cursors, users, containerRef }: RemoteCursorsProps) {
  const [scrollOffset, setScrollOffset] = useState({ x: 0, y: 0 });
  const [cursorTimestamps, setCursorTimestamps] = useState<Map<string, number>>(new Map());

  // Track when each cursor was last updated
  useEffect(() => {
    const now = Date.now();
    setCursorTimestamps(prev => {
      const next = new Map(prev);
      cursors.forEach((_, userId) => {
        next.set(userId, now);
      });
      return next;
    });
  }, [cursors]);

  // Track scroll position
  useEffect(() => {
    const updateScroll = () => {
      if (containerRef?.current) {
        setScrollOffset({
          x: containerRef.current.scrollLeft,
          y: containerRef.current.scrollTop,
        });
      } else {
        setScrollOffset({
          x: window.scrollX,
          y: window.scrollY,
        });
      }
    };

    const target = containerRef?.current || window;
    target.addEventListener('scroll', updateScroll, { passive: true });
    updateScroll();

    return () => {
      target.removeEventListener('scroll', updateScroll);
    };
  }, [containerRef]);

  const cursorData: CursorData[] = useMemo(() => {
    const now = Date.now();
    const result: CursorData[] = [];

    cursors.forEach((position, userId) => {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      const lastUpdate = cursorTimestamps.get(userId) || 0;
      const isActive = now - lastUpdate < 3000; // 3 seconds timeout

      result.push({ user, position, isActive });
    });

    return result;
  }, [cursors, users, cursorTimestamps]);

  if (cursorData.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {cursorData.map(({ user, position, isActive }) => {
        // Calculate adjusted position based on scroll difference
        const adjustedX = position.x + (position.scrollX - scrollOffset.x);
        const adjustedY = position.y + (position.scrollY - scrollOffset.y);

        return (
          <div
            key={user.id}
            className={cn(
              'absolute transition-all duration-100 ease-out',
              !isActive && 'opacity-30'
            )}
            style={{
              left: adjustedX,
              top: adjustedY,
              transform: 'translate(-2px, -2px)',
            }}
          >
            {/* Cursor pointer */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
            >
              <path
                d="M5.65376 12.4563L5.65385 12.4564L11.0001 16.9998L9.00009 17.9998L10.0001 19.9998L7.00009 21.4998L6.00009 19.4998L4.00009 20.4998L3.00009 3.99976L5.65376 12.4563Z"
                fill={user.color}
                stroke="white"
                strokeWidth="1.5"
              />
            </svg>
            
            {/* User label */}
            <div
              className={cn(
                'absolute left-4 top-4 px-2 py-0.5 rounded text-xs font-medium text-white whitespace-nowrap',
                'shadow-lg transition-opacity duration-300',
                !isActive && 'opacity-0'
              )}
              style={{ backgroundColor: user.color }}
            >
              {user.name}
            </div>
          </div>
        );
      })}
    </div>
  );
}
