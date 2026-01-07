/**
 * Services Module
 * 
 * Provides factories and implementations for:
 * - Task operations
 * - Allocation management
 * - Settings persistence
 */

// Factory
export { createGanttServices } from './factory';

// API Services
export type { TaskService } from './api-supabase/task.service';
export type { AllocationService } from './api-supabase/allocation.service';
export type { SettingsService } from './api-supabase/settings.service';

// Mock Services
export { taskMockService, allocationMockService } from './mocks';

// Interfaces
export type { ITaskService } from './interfaces/task.interface';
export type { IAllocationService } from './interfaces/allocation.interface';
export type { ISettingsService } from './interfaces/settings.interface';
