/**
 * Service Factory
 * Creates services with Supabase client from context
 * Services are now dependency-injected rather than importing directly
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ITaskService } from './interfaces/task.interface';
import type { IAllocationService } from './interfaces/allocation.interface';
import type { ISettingsService } from './interfaces/settings.interface';

// Factory functions
import { createTaskService } from './api-supabase/task.service';
import { createAllocationService } from './api-supabase/allocation.service';
import { createSettingsService } from './api-supabase/settings.service';

// Mock services
import { taskMockService, allocationMockService, settingsMockService } from './mocks';

// Check environment variable
// For Vite: import.meta.env.VITE_USE_MOCK
// For Next.js: process.env.NEXT_PUBLIC_USE_MOCK
const USE_MOCK = import.meta.env?.VITE_USE_MOCK === 'true' || 
                  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_USE_MOCK === 'true');

/**
 * Create Gantt services with Supabase client
 * Use this in your components/hooks that have access to context
 * 
 * Example:
 * const { database } = useGanttContext();
 * const services = createGanttServices(database.supabaseClient);
 * const tasks = await services.task.getTasks(projectId);
 */
export function createGanttServices(supabase: SupabaseClient) {
  return {
    task: USE_MOCK ? taskMockService : createTaskService(supabase),
    allocation: USE_MOCK ? allocationMockService : createAllocationService(supabase),
    settings: USE_MOCK ? settingsMockService : createSettingsService(supabase),
  } as {
    task: ITaskService;
    allocation: IAllocationService;
    settings: ISettingsService;
  };
}

// Export factory functions for direct use
export { createTaskService, createAllocationService, createSettingsService };
export { taskMockService, allocationMockService, settingsMockService };

// Export stores for direct access (only available in mock mode)
export { taskStore, allocationStore, settingsStore, resetAllStores, getAllStoreStates, subscribeToAllStores } from './mocks/store';

// Export flag for debugging
export const isUsingMockData = USE_MOCK;

// Log current mode in development
if (import.meta.env?.DEV || process.env?.NODE_ENV === 'development') {
  console.log(`[Gantt Services] Using ${USE_MOCK ? 'MOCK' : 'REAL'} data`);
}
