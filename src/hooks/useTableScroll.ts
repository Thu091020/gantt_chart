import { useEffect, useRef, RefObject } from 'react';

interface TableScrollOptions {
  maxHeight?: string;
}

export function useTableScroll<T extends HTMLElement>(options?: TableScrollOptions): RefObject<T> {
  const containerRef = useRef<T>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Apply max height for vertical scroll if specified
    if (options?.maxHeight) {
      container.style.maxHeight = options.maxHeight;
      container.style.overflowY = 'auto';
    }

    const handleWheel = (e: WheelEvent) => {
      // Ctrl + wheel = horizontal scroll
      if (e.ctrlKey) {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
      }
    };

    const handleScroll = () => {
      // When scrolling horizontally, scroll to top of table
      if (container.scrollLeft > 0) {
        const tableWrapper = container.closest('.bg-card, .rounded-lg');
        if (tableWrapper) {
          tableWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('scroll', handleScroll);
    };
  }, [options?.maxHeight]);

  return containerRef;
}
