import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useSettings } from './useSettings';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface UserPresence {
  id: string;
  email: string;
  name: string;
  color: string;
  x?: number;
  y?: number;
  timestamp?: number;
}

export interface CursorPosition {
  x: number;
  y: number;
  scrollX: number;
  scrollY: number;
}

// Color palette for users
const USER_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
];

const getColorForUser = (userId: string): string => {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
};

export function usePresence(channelId: string, containerRef?: React.RefObject<HTMLElement>) {
  const { user, profile } = useAuth();
  const { data: settings } = useSettings();
  const [onlineUsers, setOnlineUsers] = useState<Map<string, UserPresence>>(new Map());
  const [cursors, setCursors] = useState<Map<string, CursorPosition>>(new Map());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastCursorSentRef = useRef<number>(0);

  // Check if collaboration is enabled
  const isEnabled = settings?.collaboration_enabled !== false;

  const sendCursorPosition = useCallback((x: number, y: number) => {
    if (!channelRef.current || !user || !isEnabled) return;

    const now = Date.now();
    // Throttle to ~30fps
    if (now - lastCursorSentRef.current < 33) return;
    lastCursorSentRef.current = now;

    const scrollX = containerRef?.current?.scrollLeft || window.scrollX;
    const scrollY = containerRef?.current?.scrollTop || window.scrollY;

    channelRef.current.send({
      type: 'broadcast',
      event: 'cursor',
      payload: {
        userId: user.id,
        x,
        y,
        scrollX,
        scrollY,
        timestamp: now,
      },
    });
  }, [user, isEnabled, containerRef]);

  useEffect(() => {
    if (!user || !isEnabled) {
      setOnlineUsers(new Map());
      setCursors(new Map());
      return;
    }

    const channel = supabase.channel(`presence:${channelId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channelRef.current = channel;

    // Track presence
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = new Map<string, UserPresence>();
        
        Object.entries(state).forEach(([key, value]) => {
          const presences = value as any[];
          if (presences.length > 0 && key !== user.id) {
            users.set(key, presences[0] as UserPresence);
          }
        });
        
        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        if (key !== user.id && newPresences.length > 0) {
          setOnlineUsers(prev => {
            const next = new Map(prev);
            const presence = newPresences[0] as unknown as UserPresence;
            next.set(key, presence);
            return next;
          });
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUsers(prev => {
          const next = new Map(prev);
          next.delete(key);
          return next;
        });
        setCursors(prev => {
          const next = new Map(prev);
          next.delete(key);
          return next;
        });
      })
      .on('broadcast', { event: 'cursor' }, ({ payload }) => {
        if (payload.userId !== user.id) {
          setCursors(prev => {
            const next = new Map(prev);
            next.set(payload.userId, {
              x: payload.x,
              y: payload.y,
              scrollX: payload.scrollX,
              scrollY: payload.scrollY,
            });
            return next;
          });
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            id: user.id,
            email: user.email || '',
            name: profile?.full_name || user.email?.split('@')[0] || 'User',
            color: getColorForUser(user.id),
          });
        }
      });

    // Cleanup stale cursors every 3 seconds
    const cleanupInterval = setInterval(() => {
      setCursors(prev => {
        const now = Date.now();
        const next = new Map(prev);
        prev.forEach((cursor, key) => {
          // Cursor position is stored without timestamp in this version
          // We'll rely on presence leave events instead
        });
        return next;
      });
    }, 3000);

    return () => {
      clearInterval(cleanupInterval);
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [user, profile, channelId, isEnabled]);

  return {
    onlineUsers: Array.from(onlineUsers.values()),
    cursors,
    sendCursorPosition,
    isEnabled,
    currentUser: user ? {
      id: user.id,
      email: user.email || '',
      name: profile?.full_name || user.email?.split('@')[0] || 'User',
      color: getColorForUser(user.id),
    } : null,
  };
}
