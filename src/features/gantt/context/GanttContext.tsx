/**
 * Gantt Context Provider
 * Provides configured adapters to all child components
 */

import { createContext, useContext, ReactNode } from 'react';
import { getGanttConfig } from '../adapters';
import type { IGanttConfig } from '../adapters';

const GanttContext = createContext<IGanttConfig | null>(null);

export interface GanttProviderProps {
  children: ReactNode;
}

/**
 * Provider that makes Gantt config available to all child components
 * This is automatically used by GanttView, you don't need to use it manually
 */
export function GanttProvider({ children }: GanttProviderProps) {
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

export { GanttContext };
