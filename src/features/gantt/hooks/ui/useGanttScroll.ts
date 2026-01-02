import { useRef, useCallback } from 'react';

/**
 * Hook to synchronize scrolling between table and chart panels
 */
export function useGanttScroll() {
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const chartScrollRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);

  /**
   * Handle vertical scroll from table panel
   */
  const handleTableVerticalScroll = useCallback((scrollTop: number) => {
    if (isScrolling.current) return;
    isScrolling.current = true;

    if (chartScrollRef.current) {
      chartScrollRef.current.scrollTop = scrollTop;
    }

    requestAnimationFrame(() => {
      isScrolling.current = false;
    });
  }, []);

  /**
   * Handle vertical scroll from chart panel
   */
  const handleChartVerticalScroll = useCallback((scrollTop: number) => {
    if (isScrolling.current) return;
    isScrolling.current = true;

    if (tableScrollRef.current) {
      tableScrollRef.current.scrollTop = scrollTop;
    }

    requestAnimationFrame(() => {
      isScrolling.current = false;
    });
  }, []);

  return {
    tableScrollRef,
    chartScrollRef,
    handleTableVerticalScroll,
    handleChartVerticalScroll,
  };
}
