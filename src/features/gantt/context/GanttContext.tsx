/**
 * Gantt Context Provider
 * Provides configured adapters to all child components
 */

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { getGanttConfig } from '../adapters';
import type { IGanttConfig } from '../adapters';
import { createGanttServices } from '../services/factory';

const GanttContext = createContext<IGanttConfig | null>(null);

export interface GanttProviderProps {
  children: ReactNode;
}

/**
 * Provider that makes Gantt config available to all child components
 * Components bọc này sẽ có thể truy cập vào cấu hình gantt thông qua context
 * This is automatically used by GanttView, you don't need to use it manually
 * Đây là component được sử dụng tự động bởi GanttView, bạn không cần sử dụng thủ công
 */
export function GanttProvider({ children }: GanttProviderProps) {
  // component này bọc lấy cấu hình gantt từ adapter
  const config = getGanttConfig();
  
  return (
    <GanttContext.Provider value={config}>
      {children}
    </GanttContext.Provider>
  );
}

/**
 * Hook to access Gantt configuration
 * @throws Error if used outside GanttProvider
 */
export function useGanttContext(): IGanttConfig {
  const context = useContext(GanttContext);
  
  if (!context) {
    throw new Error(
      'useGanttContext must be used within GanttProvider. ' +
      'Make sure your component is wrapped with GanttProvider or use GanttView.'
    );
  }
  
  return context;
}

/**
 * Hook to access UI components from adapter
 */
export function useGanttUI() {
  const { ui } = useGanttContext();
  return ui;
}

/**
 * Hook to access utility functions from adapter
 */
export function useGanttUtils() {
  const { utils } = useGanttContext();
  return utils;
}

/**
 * Hook to access database client from adapter
 */
export function useGanttDatabase() {
  const { database } = useGanttContext();
  return database;
}

/**
 * Hook to access auth from adapter
 */
export function useGanttAuth() {
  const { auth } = useGanttContext();
  return auth;
}

/**
 * Hook to access Gantt services (task, allocation, settings)
 * Services are created with Supabase client from context
 */
export function useGanttServices() {
  const { database } = useGanttContext();
  return useMemo(() => createGanttServices(database.supabaseClient), [database.supabaseClient]);
}

export { GanttContext };
