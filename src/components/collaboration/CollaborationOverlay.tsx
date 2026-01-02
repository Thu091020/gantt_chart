import { useRef, useCallback, useEffect } from 'react';
import { usePresence } from '@/hooks/usePresence';
import { OnlineAvatars } from './OnlineAvatars';
import { RemoteCursors } from './RemoteCursors';

interface CollaborationOverlayProps {
  channelId: string;
  children: React.ReactNode;
  showAvatars?: boolean;
  showCursors?: boolean;
  containerRef?: React.RefObject<HTMLElement>;
}

export function CollaborationOverlay({
  channelId,
  children,
  showAvatars = true,
  showCursors = true,
  containerRef,
}: CollaborationOverlayProps) {
  const { onlineUsers, cursors, sendCursorPosition, isEnabled, currentUser } = usePresence(channelId, containerRef);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isEnabled || !showCursors) return;
    sendCursorPosition(e.clientX, e.clientY);
  }, [sendCursorPosition, isEnabled, showCursors]);

  if (!isEnabled) {
    return <>{children}</>;
  }

  return (
    <div onMouseMove={handleMouseMove} className="relative h-full">
      {children}
      
      {showCursors && (
        <RemoteCursors
          cursors={cursors}
          users={onlineUsers}
          containerRef={containerRef}
        />
      )}
    </div>
  );
}

// Export a component for just the avatars (to place in toolbar)
interface CollaborationAvatarsProps {
  channelId: string;
}

export function CollaborationAvatars({ channelId }: CollaborationAvatarsProps) {
  const { onlineUsers, isEnabled, currentUser } = usePresence(channelId);

  if (!isEnabled) return null;

  return (
    <OnlineAvatars
      users={onlineUsers}
      currentUser={currentUser}
    />
  );
}
