/**
 * Service Factory
 * Switches between real (Supabase) and mock services based on environment variable
 */

import type { ITaskService } from './interfaces/task.interface';
import type { IAllocationService } from './interfaces/allocation.interface';
import type { ISettingsService } from './interfaces/settings.interface';

// Real services
import { taskService } from './api/task.service';
import { allocationService } from './api/allocation.service';
import { settingsService } from './api/settings.service';

// Mock services
import { taskMockService, allocationMockService } from './mocks';

// Check environment variable
// For Vite: import.meta.env.VITE_USE_MOCK
// For Next.js: process.env.NEXT_PUBLIC_USE_MOCK
const USE_MOCK = import.meta.env?.VITE_USE_MOCK === 'true' || 
                  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_USE_MOCK === 'true');

/**
 * Gantt Service aggregator
 * Use this in your components/hooks
 * 
 * Example:
 * import { ganttService } from '@/feature/gantt/services/factory';
 * const tasks = await ganttService.task.getTasks(projectId);
 */
export const ganttService = {
  task: USE_MOCK ? taskMockService : taskService,
  allocation: USE_MOCK ? allocationMockService : allocationService,
  settings: settingsService, // Settings always use real service
} as {
  task: ITaskService;
  allocation: IAllocationService;
  settings: ISettingsService;
};

// Export individual services if needed
export { taskService, taskMockService };
export { allocationService, allocationMockService };
export { settingsService };

// Export flag for debugging
export const isUsingMockData = USE_MOCK;

// Log current mode in development
if (import.meta.env?.DEV || process.env?.NODE_ENV === 'development') {
  console.log(`[Gantt Services] Using ${USE_MOCK ? 'MOCK' : 'REAL'} data`);
}
