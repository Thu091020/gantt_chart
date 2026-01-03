/**
 * Services Module
 * 
 * Provides factories and implementations for:
 * - Task operations
 * - Allocation management
 * - Settings persistence
 */

// Factory
export { getServiceFactory } from './factory';

// API Services
export { taskService } from './api/task.service';
export { allocationService } from './api/allocation.service';
export { settingsService } from './api/settings.service';

// Mock Services
export { taskMockService, allocationMockService } from './mocks';

// Interfaces
export type { ITaskService } from './interfaces/task.interface';
export type { IAllocationService } from './interfaces/allocation.interface';
export type { ISettingsService } from './interfaces/settings.interface';
